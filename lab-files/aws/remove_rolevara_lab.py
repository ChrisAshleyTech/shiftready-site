#!/usr/bin/env python3
"""Removes the Rolevara AWS lab from your account.

Run in AWS CloudShell:

    python3 remove_rolevara_lab.py --dry-run   # lists what would be removed; changes nothing
    python3 remove_rolevara_lab.py

Touches only the IAM users and groups in the "rolevara-lab" stack, and only while each one is still
under the /rolevara-lab/ path. Anything you added to them while working the tickets (console
passwords, access keys, group memberships, policies, MFA devices) is removed first, so the stack can
then be deleted cleanly. Asks you to type the account ID before deleting anything.
"""
import argparse
import json
import subprocess
import sys

STACK = "rolevara-lab"
LAB_PATH = "/rolevara-lab/"


class AwsError(Exception):
    pass


def aws(*args):
    r = subprocess.run(["aws", *args, "--output", "json"], capture_output=True, text=True)
    if r.returncode != 0:
        raise AwsError(r.stderr.strip() or f"aws {' '.join(args[:2])} failed")
    return json.loads(r.stdout) if r.stdout.strip() else {}


def maybe(*args):
    try:
        return aws(*args)
    except AwsError as e:
        if "NoSuchEntity" in str(e):
            return None
        raise


class Remover:
    def __init__(self, dry):
        self.dry = dry

    def do(self, what, *args):
        print(("  would " if self.dry else "  ") + what)
        if not self.dry:
            maybe(*args)

    def strip_user(self, name):
        """Removes everything attached to a lab user, so the user itself can be deleted."""
        if maybe("iam", "get-login-profile", "--user-name", name):
            self.do(f"remove console password of {name}", "iam", "delete-login-profile", "--user-name", name)
        for k in aws("iam", "list-access-keys", "--user-name", name).get("AccessKeyMetadata", []):
            self.do(f"delete access key {k['AccessKeyId']} of {name}", "iam", "delete-access-key", "--user-name", name, "--access-key-id", k["AccessKeyId"])
        for g in aws("iam", "list-groups-for-user", "--user-name", name).get("Groups", []):
            self.do(f"remove {name} from {g['GroupName']}", "iam", "remove-user-from-group", "--user-name", name, "--group-name", g["GroupName"])
        for p in aws("iam", "list-user-policies", "--user-name", name).get("PolicyNames", []):
            self.do(f"delete inline policy {p} of {name}", "iam", "delete-user-policy", "--user-name", name, "--policy-name", p)
        for p in aws("iam", "list-attached-user-policies", "--user-name", name).get("AttachedPolicies", []):
            self.do(f"detach {p['PolicyName']} from {name}", "iam", "detach-user-policy", "--user-name", name, "--policy-arn", p["PolicyArn"])
        for m in aws("iam", "list-mfa-devices", "--user-name", name).get("MFADevices", []):
            self.do(f"remove MFA device from {name}", "iam", "deactivate-mfa-device", "--user-name", name, "--serial-number", m["SerialNumber"])

    def strip_group(self, name):
        g = maybe("iam", "get-group", "--group-name", name)
        if not g:
            return
        for u in g.get("Users", []):
            self.do(f"remove {u['UserName']} from {name}", "iam", "remove-user-from-group", "--user-name", u["UserName"], "--group-name", name)
        for p in aws("iam", "list-group-policies", "--group-name", name).get("PolicyNames", []):
            self.do(f"delete inline policy {p} of {name}", "iam", "delete-group-policy", "--group-name", name, "--policy-name", p)
        for p in aws("iam", "list-attached-group-policies", "--group-name", name).get("AttachedPolicies", []):
            self.do(f"detach {p['PolicyName']} from {name}", "iam", "detach-group-policy", "--group-name", name, "--policy-arn", p["PolicyArn"])


def main():
    ap = argparse.ArgumentParser(description="Remove the Rolevara AWS lab.")
    ap.add_argument("--dry-run", action="store_true", help="list what would be removed without changing anything")
    a = ap.parse_args()

    try:
        stack = aws("cloudformation", "describe-stacks", "--stack-name", STACK)["Stacks"][0]
    except AwsError:
        sys.exit(f"No '{STACK}' stack in this account and Region. Nothing to remove.")
    resources = aws("cloudformation", "list-stack-resources", "--stack-name", STACK).get("StackResourceSummaries", [])

    # Only objects still under the lab path are touched; anything else is reported and left alone.
    users, groups, skipped = [], [], []
    for r in resources:
        name = r.get("PhysicalResourceId")
        if not name:
            continue
        if r["ResourceType"] == "AWS::IAM::User":
            u = maybe("iam", "get-user", "--user-name", name)
            if u and u["User"]["Path"] != LAB_PATH:
                skipped.append(name)
            elif u:
                users.append(name)
        elif r["ResourceType"] == "AWS::IAM::Group":
            g = maybe("iam", "get-group", "--group-name", name)
            if g and g["Group"]["Path"] != LAB_PATH:
                skipped.append(name)
            elif g:
                groups.append(name)
    if skipped:
        sys.exit(f"These aren't under {LAB_PATH} any more, so nothing was changed: {', '.join(skipped)}. Delete the stack by hand in the CloudFormation console.")

    account = aws("sts", "get-caller-identity")["Account"]
    print(f"\nAccount: {account}\nRemoves: stack '{STACK}' ({stack['StackStatus']}), {len(users)} IAM users and {len(groups)} IAM groups under {LAB_PATH}.\n")
    if not a.dry_run:
        typed = input(f"Type the account ID {account} to remove the lab: ").strip()
        if typed != account:
            sys.exit("The account ID didn't match. Nothing was changed.")

    rm = Remover(a.dry_run)
    for u in users:
        rm.strip_user(u)
    for g in groups:
        rm.strip_group(g)

    if a.dry_run:
        print(f"  would delete stack {STACK} (its users, groups and access key)")
        print("\nDry run: nothing was changed.")
        return

    # A stack left in DELETE_FAILED by an earlier run is deleted keeping the failed resources, which
    # are then removed directly (they were already stripped above).
    retain = []
    if stack["StackStatus"] == "DELETE_FAILED":
        retain = [r["LogicalResourceId"] for r in resources if r["ResourceStatus"] == "DELETE_FAILED"]
    print(f"  delete stack {STACK}")
    aws("cloudformation", "delete-stack", "--stack-name", STACK, *(["--retain-resources", *retain] if retain else []))
    try:
        aws("cloudformation", "wait", "stack-delete-complete", "--stack-name", STACK)
    except AwsError:
        sys.exit("The stack didn't delete cleanly. Run this script again; it retries and removes what is left.")
    for r in resources:
        if r["LogicalResourceId"] in retain:
            name = r["PhysicalResourceId"]
            if r["ResourceType"] == "AWS::IAM::User":
                maybe("iam", "delete-user", "--user-name", name)
            elif r["ResourceType"] == "AWS::IAM::Group":
                maybe("iam", "delete-group", "--group-name", name)
    print("\nThe lab is removed. You can seed it again with: python3 seed_rolevara_lab.py")


if __name__ == "__main__":
    try:
        main()
    except AwsError as e:
        sys.exit(f"AWS CLI error: {e}")
    except KeyboardInterrupt:
        sys.exit("\nStopped.")
