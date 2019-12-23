import got from 'got'

import redisCli from 'root/lib/redis'
import settings from 'root/settings'
import {MediaTypes} from 'root/type'

const serverUrl = settings.neteaseApiServer.replace('\/$/g', '')

namespace Utils {
    export const musicSrcCacheExpire = 3600 * 6
    export const musicBaseInfoCacheExpire = 3600 * 24 * 3
    export const musicLyricCacheExpire = 3600 * 24 * 7
    export const musicCommentsChacheExpire = 3600 * 24 * 7
    
    export const getMusicItemBaseInfoKey = (ids: string | string[]) => `musicbaseInfo:${typeof ids === 'string' ? ids : ids.join(',')}`

    export function extractBaseMusicInfo (item) {
        return {
            id: item.id + '',
            name: item.name,
            artist: item.ar.map(ar => ar.name).join('/'),
            album: item.al.name,
            pic: item.al.picUrl,
            duration: Math.ceil(item.dt / 1000),
            free: !item.fee
        }
    }

    export const albumInfoCacheExpire = 3600 * 24 * 30

    export const searchCacheExpire = 3600 * 1

    export const MediaTypesToValue = {
        [MediaTypes.album]: 10,
        [MediaTypes.song]: 1,
    }

}

export async function getMusicInfo (ids: string[]) {
    const baseInfoArr = await getMusicBaseInfo(ids)

    const srcArr = await redisCli.tryGet(`musicsrc${ids.join(',')}`, async () => {
        const reqRes = await got.get(serverUrl + '/song/url', {
            json: true,
            query: {
                id: ids
            }
        });
        return (reqRes.body.data as any[]).map(item => {
            return item.url as string
        })
    }, Utils.musicSrcCacheExpire)

    return Promise.all(baseInfoArr.map(async (item, index) => {
        const comments = await redisCli.tryGet(`musiccomments:${item.id}`, async () => {
            const reqRes = await got.get(serverUrl + '/comment/hot', {
                query: {
                    id: item.id,
                    type: 0,
                },
                json: true
            })
            return (reqRes.body.hotComments as any[]).map(item => {
                const {user: {userId, avatarUrl, nickname: nickName}, content} = item
                return {
                    userId,
                    avatarUrl,
                    nickName,
                    content
                }
            })
        }, Utils.musicCommentsChacheExpire)

        const lyric = await redisCli.tryGet(`musiclyric:${item.id}`, async () => {
            const reqRes = await got.get(serverUrl + '/lyric', {
                query: {
                    id: item.id,
                },
                json: true
            })
            return reqRes.body.lrc.lyric
        }, Utils.musicLyricCacheExpire)
        return {
            ...item,
            src: srcArr[index],
            lyric,
            comments
        }
    }))

}

export async function getAlbumInfo (id: string) {
    return await redisCli.tryGet(`albumn:${id}`, async (cacheKey) => {
        const reqRes = await got.get(serverUrl + '/album', {
            json: true,
            query: {
                id
            }
        })
        const {songs, album} = reqRes.body

        const musicList = await Promise.all((songs as any[]).map(s => {
            const info = Utils.extractBaseMusicInfo(s)
            return redisCli.tryGet(Utils.getMusicItemBaseInfoKey(s.id), () => {
                return info
            }, Utils.musicBaseInfoCacheExpire, [cacheKey])
        }))
        const albumInfo = {
            id: album.id + '',
            name: album.name,
            desc: album.description,
            pic: album.picUrl,
            musicList,
        }
        return albumInfo
    }, Utils.albumInfoCacheExpire)
}

export async function searchMedia (searchStr: string, type: MediaTypes) {
    return redisCli.tryGet(`musicsearch:${searchStr}`, async (searchCacheKey) => {
        const reqRes = await got.get(serverUrl + '/search', {
            json: true,
            query: {
                type: Utils.MediaTypesToValue[type],
                keywords: searchStr
            }
        })
        const result = reqRes.body.result
        return ((result.songs || result.albums) as any[]).map((item) => {
            const baseInfo = {
                type,
                id: item.id + '',
                title: item.name,
            }
            const artistStr = item.artists.map(item => item.name).join('/')
            return type === MediaTypes.album ? {
                ...baseInfo,
                pic: item.picUrl,
                desc: artistStr,
            } : {
                ...baseInfo,
                desc: `《${item.album.name}》-${artistStr}`
            }
        })
    }, Utils.searchCacheExpire)
}

export function getMusicBaseInfo (id: string | string[]) {
    return redisCli.tryGet(Utils.getMusicItemBaseInfoKey(id), async (cacheKey) => {
        const reqRes = await got.get(serverUrl + '/song/detail', {
            json: true,
            query: {
                ids: id
            }
        })
        const {songs, privileges} = reqRes.body as {songs: any[], privileges: any[]}
        return Promise.all(songs.map(s => {
            const info = Utils.extractBaseMusicInfo(s)
            return redisCli.tryGet(Utils.getMusicItemBaseInfoKey(info.id), () => {
                return info
            }, Utils.musicBaseInfoCacheExpire, [cacheKey])
        }))
    }, Utils.musicBaseInfoCacheExpire)
}


async function test () {
    // console.log((await getMusicInfo(['347230']))[0])
    // console.log(await getAlbumInfo('2301158'))
    // console.log(await searchMusic('许嵩', MediaTypes.album))
}

test()