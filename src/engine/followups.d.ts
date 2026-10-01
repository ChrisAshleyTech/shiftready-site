// Loose types for followups.js: the engine stays plain JS and is covered by tests/*.test.js.
export declare let STANDING: any;
export declare let CONSEQ: any;
export declare let REPLIES: any;
export declare let FOLLOW: any;
export declare const DELAY: { followUp: number; reply: number };
export declare const STANDING_AT: number[];
export declare const buildFollow: any;
export declare const queueTickets: any;
export declare const queueDone: () => boolean;
export declare const escalatedOn: any;
export declare const releaseAll: any;
export declare const afterClose: any;
export declare const reopen: any;
export declare const migrate: any;
export declare const setLiveQueue: (on: boolean) => void;
export declare function setFollowUps(conseq: any[], standing: any[], links: any, replies?: any): void;
