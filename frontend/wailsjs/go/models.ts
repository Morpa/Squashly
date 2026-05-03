export namespace git {
	
	export class Branch {
	    name: string;
	    isCurrent: boolean;
	    isRemote: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Branch(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.isCurrent = source["isCurrent"];
	        this.isRemote = source["isRemote"];
	    }
	}
	export class Commit {
	    hash: string;
	    shortHash: string;
	    message: string;
	    author: string;
	    email: string;
	    // Go type: time
	    date: any;
	    body: string;
	    selected: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Commit(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hash = source["hash"];
	        this.shortHash = source["shortHash"];
	        this.message = source["message"];
	        this.author = source["author"];
	        this.email = source["email"];
	        this.date = this.convertValues(source["date"], null);
	        this.body = source["body"];
	        this.selected = source["selected"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class RepoInfo {
	    path: string;
	    name: string;
	    currentBranch: string;
	    totalCommits: number;
	    hasUncommitted: boolean;
	
	    static createFrom(source: any = {}) {
	        return new RepoInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.name = source["name"];
	        this.currentBranch = source["currentBranch"];
	        this.totalCommits = source["totalCommits"];
	        this.hasUncommitted = source["hasUncommitted"];
	    }
	}
	export class SquashRequest {
	    repoPath: string;
	    commitHashes: string[];
	    message: string;
	    body: string;
	
	    static createFrom(source: any = {}) {
	        return new SquashRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.repoPath = source["repoPath"];
	        this.commitHashes = source["commitHashes"];
	        this.message = source["message"];
	        this.body = source["body"];
	    }
	}
	export class SquashResult {
	    success: boolean;
	    newHash: string;
	    message: string;
	    errorMsg?: string;
	
	    static createFrom(source: any = {}) {
	        return new SquashResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.newHash = source["newHash"];
	        this.message = source["message"];
	        this.errorMsg = source["errorMsg"];
	    }
	}

}

