import bitSymbolsConfig from 'root/default/bitSymbols.default.json'
import BlockWordListConfig from 'root/default/blockWords.default.json'
import BlockMusicListConfig from 'root/default/blockMusic.default.json'
import EmojiDataConfig from 'root/default/emojiData.default.json'

export interface Settings {
    neteaseApiServer: string;
    httpServer: string;
    port: number;
    sessionKey: string;
    sessionSecret: string;
    sessionExpire: number; // 单位s
    redisPort: number;
    redisHost: string;
    corsOrigin: string[]; // http/socket server 允许的跨域请求源
    musicDurationLimit: number; // 音乐时长限制
    superAdminToken: string[]; // token 认证模式下的超级管理员token
    maxChatListLength: number; // 服务端记录的房间聊天记录条数上限
    hashSalt: string;
    superAdminRegisterTokens: string[];
    openWordValidate: boolean; // 是否开启敏感词过滤
    coordDataCalcDuration: number ;// 房间热点数据整理计算刷新周期 单位s
    coordDataResetDuration: number; // 热点数据重置周期 单位s
    notAllowCreateRoom: boolean;// 是否允许创建房间
    // 以下仅在dev模式下有效
    openRandomIpMode: boolean; // 为用户随机分配所属ip地址
}

// 客户端配置字段类型
export {default as ClientSettings} from 'global/common/clientSetting.type'

export type BitSymbols  = typeof bitSymbolsConfig 

export type BlockWordList = typeof BlockWordListConfig

export type BlockMusicList = typeof BlockMusicListConfig

export type EmojiData = typeof EmojiDataConfig

