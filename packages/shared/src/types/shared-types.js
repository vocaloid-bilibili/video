// 共享类型定义
// 这个文件导出控制器和Remotion引擎都需要使用的类型

/**
 * @typedef {number | "-"} NumberOrNone
 */

/**
 * @typedef {Object} Stats
 * @property {number} view
 * @property {number} favorite
 * @property {number} coin
 * @property {number} like
 * @property {number} danmaku
 * @property {number} reply
 * @property {number} share
 * @property {number} viewR
 * @property {number} favoriteR
 * @property {number} coinR
 * @property {number} likeR
 * @property {number} danmakuR
 * @property {number} replyR
 * @property {number} shareR
 * @property {number} fixA
 * @property {number} fixB
 * @property {number} fixC
 * @property {number} fixD
 * @property {number} point
 * @property {string} image_url
 * @property {number} view_rank
 * @property {number} favorite_rank
 * @property {number} coin_rank
 * @property {number} like_rank
 * @property {number} danmaku_rank
 * @property {number} reply_rank
 * @property {number} share_rank
 */

/**
 * @typedef {Object} SongInfo
 * @property {string} title
 * @property {string} bvid
 * @property {number} aid
 * @property {string} name
 * @property {string} author
 * @property {string} uploader
 * @property {number} copyright
 * @property {string} synthesizer
 * @property {string} vocal
 * @property {string} type
 * @property {string} pubdate
 * @property {string} duration
 * @property {number} page
 */

/**
 * @typedef {Object} Appendix
 * @property {boolean} showCount
 * @property {string} trendKey
 * @property {number} trendCount
 * @property {string} videoSource
 * @property {number} point
 */

/**
 * @typedef {Object} BasicRank
 * @property {number} rank
 * @extends {Appendix}
 * @extends {Stats}
 * @extends {SongInfo}
 */

/**
 * @typedef {Object} WeeklyMain
 * @property {number} count
 * @property {NumberOrNone} rank_before
 * @property {NumberOrNone} point_before
 * @property {string} rate
 * @property {any[]} honor
 * @property {Object.<string, NumberOrNone>} seperate_ranks
 * @extends {BasicRank}
 */

// 导出类型
export const SharedTypes = {
  // 这里主要作为文档，实际使用时通过JSDoc引用
};

// 路径配置类型
/**
 * @typedef {Object} PathConfig
 * @property {string} base - 基础路径
 * @property {string} segments - 分片路径
 * @property {string} final - 最终视频路径
 */