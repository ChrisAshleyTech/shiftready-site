#!/usr/bin/env python3
"""Read-only check of the Rolevara AWS lab, for grading in the browser.

Run in AWS CloudShell:

    python3 check_rolevara_lab.py

Reads the IAM users and groups in the "rolevara-lab" stack: console access (and when it was set
up), active access keys, Department and JobTitle tags, and membership of the lab groups. It makes
only describe, list and get calls and changes nothing, so it can run as a user or role with the
AWS managed ReadOnlyAccess policy. It uses CloudShell's own credentials; no access keys are needed.

Writes rolevara-aws-export.json with only the lab users; it doesn't include your account ID or any
other IAM objects. In CloudShell choose Actions > Download file, then upload it on the Rolevara
"Connect your lab" page. Grading happens in your browser and the file isn't sent anywhere.
"""
import json
import subprocess
import sys
from datetime import datetime, timezone

STACK = "rolevara-lab"
OUT = "rolevara-aws-export.json"


class AwsError(Exception):
    pass


def aws(*args):
    r = subprocess.run(["aws", *args, "--output", "json"], capture_output=True, text=True)
    if r.returncode != 0:
        raise AwsError(r.stderr.strip() or f"aws {' '.join(args[:2])} failed")
    return json.loads(r.stdout) if r.stdout.strip() else {}


def maybe(*args):
    """Like aws(), but returns None when the object doesn't exist."""
    try:
        return aws(*args)
    except AwsError as e:
        if "NoSuchEntity" in str(e):
            return None
        raise


def iso(t):
    return datetime.fromisoformat(t.replace("Z", "+00:00")).astimezone(timezone.utc).isoformat() if t else None


def main():
    try:
        stack = aws("cloudformation", "describe-stacks", "--stack-name", STACK)["Stacks"][0]
    except AwsError:
        sys.exit(f"No '{STACK}' stack in this account and Region. Seed the lab first, or switch CloudShell to the Region you seeded in.")
    if stack["StackStatus"] not in ("CREATE_COMPLETE", "UPDATE_COMPLETE", "UPDATE_ROLLBACK_COMPLETE"):
        sys.exit(f"The lab stack is {stack['StackStatus']}. Remove the lab and seed it again.")

    # Seeded = when the stack finished creating; changes after that are the learner's work.
    events = aws("cloudformation", "describe-stack-events", "--stack-name", STACK).get("StackEvents", [])
    done = [e["Timestamp"] for e in events if e["LogicalResourceId"] == STACK and e["ResourceStatus"] == "CREATE_COMPLETE"]
    seeded = iso(done[0] if done else stack["CreationTime"])

    resources = aws("cloudformation", "list-stack-resources", "--stack-name", STACK).get("StackResourceSummaries", [])
    users = sorted(r["PhysicalResourceId"] for r in resources if r["ResourceType"] == "AWS::IAM::User")
    lab_groups = {r["PhysicalResourceId"] for r in resources if r["ResourceType"] == "AWS::IAM::Group"}

    out = []
    for name in users:
        u = maybe("iam", "get-user", "--user-name", name)
        if not u:
            print(f"  warning: {name} was not found (deleted?)")
            out.append({"key": name, "deleted": True})
            continue
        tags = {t["Key"]: t["Value"] for t in aws("iam", "list-user-tags", "--user-name", name).get("Tags", [])}
        groups = sorted(g["GroupName"] for g in aws("iam", "list-groups-for-user", "--user-name", name).get("Groups", []) if g["GroupName"] in lab_groups)
        login = maybe("iam", "get-login-profile", "--user-name", name)
        keys = aws("iam", "list-access-keys", "--user-name", name).get("AccessKeyMetadata", [])
        out.append({
            "key": name, "name": tags.get("DisplayName"), "employeeId": tags.get("EmployeeId"),
            "consoleAccess": bool(login), "loginProfileCreated": iso(login["LoginProfile"]["CreateDate"]) if login else None,
            "activeAccessKeys": sum(1 for k in keys if k["Status"] == "Active"),
            "department": tags.get("Department"), "jobTitle": tags.get("JobTitle"), "groups": groups,
        })
        print(f"  read  {name}")

    with open(OUT, "w") as f:
        json.dump({"schema": "rolevara-aws-export/1", "exportedAt": datetime.now(timezone.utc).isoformat(), "seededAt": seeded, "users": out}, f, indent=2)
    print(f"\nExported to {OUT}")
    print("Download it (Actions > Download file) and upload it on the Rolevara 'Connect your lab' page, AWS lab, Upload results tab.")


if __name__ == "__main__":
    try:
        main()
    except AwsError as e:
        sys.exit(f"AWS CLI error: {e}")
