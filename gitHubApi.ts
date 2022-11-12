import { Octokit } from "octokit";
import ListLanguage from "./listLanguage";
require('dotenv').config({ path: __dirname + '/.env' });
const octokit = new Octokit({
    auth: process.env.TOKEN1
    // auth: process.env.TOKEN2;
});
/**
 * return a list language of repo in user
 * @remarks use https://docs.github.com/en/rest/repos/repos#list-repository-languages
 * @param {string} user unsername of target user
 * @param {string} repo name of target repo of user
 * @returns return : {name:byte, name2:byte}
 */
async function listRepoLanguage(user: string, repo: string) {
    const res = await octokit.request('GET /repos/{owner}/{repo}/languages', {
        owner: user,
        repo: repo
    });
    return res.data
}

/**
 * return a list of repo of user
 * @remarks use https://docs.github.com/en/rest/repos/repos#list-repositories-for-a-user
 * @param  {string} user unsername of target user
 *  @param  {string} exclude list of exlude repos
 * @returns Array of repo object
 */
async function getListRepo(user: string, exclude?: Array<string>) {
    let loop: boolean = true;
    let loopIndex: number = 1;
    let listRepo = [];
    while (loop) {
        const res = await octokit.request('GET /users/{username}/repos', {
            username: user,
            per_page: 100,
            page: loopIndex
        });
        let iseEclude = false;
        if (typeof exclude != 'undefined') {
            res.data.forEach(element => {
                if (exclude.includes(element.name)) {
                    iseEclude = true;
                }
            });
        }
        if (!iseEclude) {
            listRepo = listRepo.concat(res.data);
        }
        if (res.data.length < 30) {
            loop = false;
        }
        loopIndex++;
    }
    return listRepo;
}
/**
 * lis all organisation of user
 * @remarks use https://docs.github.com/en/rest/orgs/orgs#list-organizations-for-a-user
 * @param  {string} user unsername of target user
 * @returns Array of organisation object
 */
async function getListOrgs(user: string) {
    let loop: boolean = true;
    let loopIndex: number = 1;
    let listOrgs = [];
    while (loop) {
        const res = await octokit.request('GET /users/{username}/orgs', {
            username: user,
            per_page: 100,
            page: loopIndex
        });
        listOrgs = listOrgs.concat(res.data);
        if (res.data.length < 30) {
            loop = false;
        }
        loopIndex++;
    }
    return listOrgs;
}

/**
 * list repo of organisation
 * @remarks use https://docs.github.com/en/rest/repos/repos#list-organization-repositories
 * @param {string} org name of organisation
 * @returns Array of organisation
 */
async function getListRepoOfOrg(org: string) {
    let loop: boolean = true;
    let loopIndex: number = 1;
    let listRepo = [];
    while (loop) {
        const res = await octokit.request('GET /orgs/{org}/repos', {
            org: org,
            per_page: 100,
            page: loopIndex
        });
        listRepo = listRepo.concat(res.data);
        if (res.data.length < 30) {
            loop = false;
        }
        loopIndex++;
    }
    return listRepo;
}
/**
 * for mix response of getComit()
 * @param {Array<Promise<Map<string, { additions: number, deletions: number }>>>} listMap list stats of repo
 * @returns {Array<Promise<Map<string, { additions: number, deletions: number }>>>}
 */
async function mixMap(listMap: Array<Promise<Map<string, { additions: number, deletions: number }>>>) {
    // it's a final map
    const Global = new Map<string, { additions: number, deletions: number }>();
    let total: { additions: number, deletions: number } = { additions: 0, deletions: 0 }
    // await Promise.all -> for create a async forEach
    const sleep = listMap.map(async Element => {
        // calback of map
        return new Promise(async (resolve) => {
            // Element is a promise<map> create forEach of map 
            (await Element).forEach((values, keys) => {
                // if this language dosent exist in global
                if (typeof Global.get(keys) == 'undefined') {
                    Global.set(keys, { additions: values.additions, deletions: values.deletions });
                } else {
                    //add value at global
                    const add: number = Global.get(keys).additions + values.additions;
                    const del: number = Global.get(keys).deletions + values.deletions;
                    Global.set(keys, { additions: add, deletions: del })
                }
                total = { additions: total.additions + values.additions, deletions: total.deletions + values.deletions }
            });
            resolve(true);
        })
    });
    await Promise.all(sleep);
    Global.set('total', total);
    return Global;
}
/**
 * list all language in commit
 * @remarks use https://docs.github.com/en/rest/commits/commits#list-commits
 * @param owner owner of repo
 * @param repo name of repo
 * @param hash ref of repo
 * @returns map<nameofLanguage,{ additions:number, deletions:number }>
 */
async function getComit(owner: string, repo: string, hash: string) {
    const res = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}', {
        owner: owner,
        repo: repo,
        ref: hash
    })
    const nameFile = new Map<string, { additions: number, deletions: number }>();
    res.data.files.forEach(element => {
        if (element.filename.includes('.')) {
            let extention: string = '.' + element.filename.split('.')[element.filename.split('.').length - 1];
            const lang = ListLanguage.get(extention);
            if (typeof lang != 'undefined' && (lang.type == 'programming' || lang.type == 'markup')) {
                if (typeof nameFile.get(lang.language) == 'undefined') {
                    nameFile.set(lang.language, { additions: element.additions, deletions: element.deletions });
                } else {
                    const add: number = nameFile.get(lang.language).additions + element.additions;
                    const del: number = nameFile.get(lang.language).deletions + element.deletions;
                    nameFile.set(lang.language, { additions: add, deletions: del })
                }
            }
        }
    })
    return (nameFile);
}
/**
 * for check stats of token  
 * @remarks use https://docs.github.com/en/rest/rate-limit#get-rate-limit-status-for-the-authenticated-user
 * @returns stat of token
 */
async function getRate() {
    return (await octokit.request('GET /rate_limit', {})).data;
}
/**
 * @remarks use https://docs.github.com/en/rest/commits/commits#list-commits
 * @param owner owner of repo
 * @param repo target repo
 * @param {String|undefined} author filter the response
 * @returns map<nameofLanguage,{ additions:number, deletions:number }>
 */
async function listComit(owner: string, repo: string, author?: string, exclude?: Array<string>) {
    let listRepo = [];
    let loop: boolean = true;
    let loopIndex: number = 1;
    while (loop) {
        const res = await octokit.request('GET /repos/{owner}/{repo}/commits', {
            owner: owner,
            repo: repo,
            author: author,
            per_page: 100,
            page: loopIndex
        });
        const data: Array<any> = [];
        if (typeof exclude != 'undefined') {
            res.data.forEach(element => {
                if (!exclude.includes(element.sha)) {
                    data.push(element);
                }
            });
        }
        listRepo = listRepo.concat(data);
        if (res.data.length < 30) {
            loop = false;
        }
        loopIndex++;
    }
    return listRepo.map(element => {
        return getComit(owner, repo, element.sha);
    });
}
/**
 * log the language used by username
 * @param {string} userName 
 */
async function listAllComitOfUser(userName: string, excludeRepo?: Array<string>, excludeComit?: Array<string>) {
    // //list orgs of username
    const orgs: Array<any> = await getListOrgs(userName);
    let comits: Array<Promise<Map<string, { additions: number; deletions: number; }>>> = [];

    // in first list all comit created by user in orgs 
    const sleep = orgs.map(async Org => {
        // list of repo of orgs
        const sleep1 = (await getListRepoOfOrg(Org.login)).map(async Repo => {
            // add comit of this repo
            const comitIn = await listComit(Org.login, Repo.name, userName, excludeComit);
            comits = comits.concat(comitIn);
        });
        await Promise.all(sleep1);
    });

    // and list all comit creted in his repo

    const sleep2 = (await getListRepo(userName, excludeRepo)).map(async Repo => {
        // add comit of his repo
        const comitIn = await listComit(userName, Repo.name, userName, excludeComit);
        comits = comits.concat(comitIn);
    });
    await Promise.all(sleep);
    await Promise.all(sleep2);
    return (await mixMap(comits));
}
// listComit('Menu-Vaucanson', 'Mobile', 'Wiwok');
// listComit('UnelDev', 'MasterMind');
// getListRepoOfOrg('Menu-Vaucanson');

export default listAllComitOfUser;
export { getListRepo, mixMap, getComit, getRate, listComit };