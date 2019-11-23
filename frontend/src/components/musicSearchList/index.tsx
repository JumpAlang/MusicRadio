import React, { useEffect, useState, useMemo, useRef } from 'react'
import bindClass from 'classnames'
import { connect } from 'dva'
import { useMediaQuery } from 'react-responsive'
import { Input } from 'antd'
import ScrollBar from 'react-perfect-scrollbar'

import HashRoute, { hashRouter } from '@/components/hashRouter'
import useKeyBoardListen from '@/components/hooks/keyboardListen'
import usePreventScorllAndSwipe from '@/components/hooks/preventScrollAndSwipe'
import { ConnectState, ConnectProps, CenterModelState, PlayListModelState } from '@/models/connect'
import { MediaTypes, SearchMusicItem } from '@/typeConfig'
import configs from '@/config'
import {joinPath} from '@/utils'
import styles from './index.less'

const { Search } = Input

type ListType = CenterModelState['searchMusicList']

interface Props extends ConnectProps {
    list: ListType;
    playList: PlayListModelState['playList'];
    mediaDetail: CenterModelState['searchMediaDetail'];
    baseHashPath?: string;
}

const SearchResultTypesToLabel = {
    [MediaTypes.album]: '专辑',
    [MediaTypes.song]: '单曲'
}

const MusicSearchList: React.FC<Props> = (props) => {
    const { list = [], dispatch, playList, mediaDetail, baseHashPath = '' } = props
    const isMobile = useMediaQuery({ query: configs.mobileMediaQuery })
    const boxRef = usePreventScorllAndSwipe()

    useEffect(() => {
        dispatch({
            type: 'center/saveData',
            payload: {
                searchMusicList: [],
                searchMediaDetail: null,
            }
        })
    }, [])

    useEffect(() => {
        dispatch({
            type: 'center/saveData',
            payload: {
                searchMusicList: []
            }
        })
    }, [])

    const playListIdSet = useMemo(() => {
        const set = new Set()
        if (playList) {
            return set
        }
        playList.forEach(i => set.add(i.id))
        return set
    }, [playList])

    const handleSerach = useMemo(() => {
        return (v) => {
            if (!v) {
                return
            }
            dispatch({
                type: 'center/Music',
                payload: {

                }
            })
        }
    }, [])

    const handleSelect = useMemo(() => {
        return (item) => {
            if (item.type === MediaTypes.song) {
                //TODO dispatch
                dispatch({
                    type: 'center/addMusicToPlayList',
                    payload: {}
                })
            } else {
                hashRouter.push('/musicSearch/step2')
                dispatch({
                    type: 'center/reqMediaDetail',
                    payload: {}
                })
            }
        }
    }, [])

    const renderDetailItemList = (list: SearchMusicItem[], key = null) => {
        return <div className={styles.detailItemsList} key={key}>
            {list.map(i => {
                return <div key={i.id} className={styles.item} onClick={_ => handleSelect(i)}>
                    <div className={styles.left}>
                        <img src={i.pic} />
                    </div>
                    <div className={styles.right}>
                        <div className={styles.content}>
                            <div className={styles.title} title={i.title}>{i.title}</div>
                            <div className={styles.desc} title={i.desc}>{i.desc}</div>
                        </div>
                        <div className={styles.actions}>
                            {
                                playListIdSet.has(i.id) ? <span className={styles.added}>已添加</span> :
                                    <span className={bindClass('iconfont', 'icon-add')}></span>}
                        </div>
                    </div>
                </div>
            })}
        </div>
    }

    return <div ref={boxRef} className={styles.searchMusicListBox} style={{ height: isMobile ? '40vh' : '50vh' }}
    >
        <HashRoute path={joinPath(baseHashPath, '/')} exact={true}>
            <div className={styles.step1Box}>
                <ScrollBar className={styles.searchList}>
                    {
                        list.length ? list.map(item => {
                            if (!item.list.length) {
                                return null
                            }
                            return <div className={styles.subListItem} key={item.type}>
                                <div className={styles.header}>{SearchResultTypesToLabel[item.type]}</div>
                                {renderDetailItemList(item.list, item.type)}
                            </div>
                        }) :
                            <div className={styles.noData}>
                                暂无数据
                        </div>
                    }
                </ScrollBar>

                <div className={styles.searchArea}>
                    <Search style={{ width: '100%' }} placeholder="搜索" onSearch={handleSerach} />
                </div>
            </div>
        </HashRoute>
        <HashRoute path={joinPath(baseHashPath, '/musicSearch/step2')} exact={true}>
            <div className={styles.step2Box}>
                <div className={styles.header} onClick={_ => hashRouter.push('/musicSearch')}><span className="iconfont icon-back-circle"></span><span>返回</span></div>
                {
                    mediaDetail && <ScrollBar className={styles.detail}>
                        <div className={styles.header}>
                            <div className={styles.name}>《{mediaDetail.name}》</div>
                            <div className={styles.actions}>
                                <div className={bindClass(styles.btn, isMobile && styles.mobile)}>
                                    <span className="iconfont icon-check-circle"></span>
                                    <span>全部添加</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.list}>
                            {
                                renderDetailItemList(mediaDetail.list || [])
                            }
                        </div>
                    </ScrollBar>}
                {
                    !mediaDetail && <div className={styles.noData}>
                        暂无数据
                    </div>}
            </div>
        </HashRoute>
    </div>
}

export default connect(({ center, playList }: ConnectState) => {
    return {
        list: center.searchMusicList,
        mediaDetail: center.searchMediaDetail,
        playList: playList.playList,
    }
})(MusicSearchList)