import { Octokit } from "octokit";
import ListLanguage from "./listLanguage";
require('dotenv').config({ path: __dirname + '/.env' });
const octokit = new Octokit({
    auth: process.env.TOKEN1
    // auth: process.env.TOKEN2;
})
async function listLanguage(user: string, repo: string) {
    const res = await octokit.request('GET /repos/{owner}/{repo}/languages', {
        owner: user,
        repo: repo
    });
    console.log('language of ' + repo);
    console.log(res.data)
}
async function getListRepo(user: string) {
    let loop: boolean = true;
    let loopIndex: number = 1;
    let listRepo = [];
    while (loop) {
        const res = await octokit.request('GET /users/{username}/repos', {
            username: user,
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
async function mixMap(listMap: Array<Promise<Map<string, { additions: number, deletions: number }>>>) {
    console.log('mix all ' + listMap.length + ' data');
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
async function getRate() {
    return (await octokit.request('GET /rate_limit', {})).data;
}
async function listComit(owner: string, repo: string, author?: string) {
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
        listRepo = listRepo.concat(res.data);
        if (res.data.length < 30) {
            loop = false;
        }
        loopIndex++;
    }
    return listRepo.map(element => {
        return getComit(owner, repo, element.sha);
    });
}
async function listAllComitOfUser(userName: string) {
    console.log('list of repo where ' + userName + ' have contributed');
    // //list orgs of username
    const orgs: Array<any> = await getListOrgs(userName);
    let comits: Array<Promise<Map<string, { additions: number; deletions: number; }>>> = [];

    // in first list all comit created by user in orgs 
    const sleep = orgs.map(async Org => {
        // list of repo of orgs
        const sleep1 = (await getListRepoOfOrg(Org.login)).map(async Repo => {
            console.log(Org.login + '/' + Repo.name);
            // add comit of this repo
            const comitIn = await listComit(Org.login, Repo.name, userName);
            console.log('in ' + Org.login + '/' + Repo.name + ' : ' + comitIn.length + ' commit');
            comits = comits.concat(comitIn);
        });
        await Promise.all(sleep1);
    });

    // and list all comit creted in his repo

    const sleep2 = (await getListRepo(userName)).map(async Repo => {
        // add comit of his repo
        const comitIn = await listComit(userName, Repo.name, userName);
        console.log('in ' + userName + '/' + Repo.name + ' : ' + comitIn.length + ' commit');
        comits = comits.concat(comitIn);
    });
    await Promise.all(sleep);
    await Promise.all(sleep2);
    console.log('reading of ' + comits.length + ' comit');
    console.log('please wait');
    console.log(await mixMap(comits));
}
// listComit('Menu-Vaucanson', 'Mobile', 'Wiwok');
// listComit('UnelDev', 'MasterMind');
// getListRepoOfOrg('Menu-Vaucanson');

(async () => {
    console.log('start');
    const size1 = await getRate();
    // console.log(size1);
    await listAllComitOfUser('UnelDev');
    const size2 = await getRate();
    console.log('consume ' + (size2.rate.used - size1.rate.used) + ' request, left ' + size2.rate.remaining);
})();
