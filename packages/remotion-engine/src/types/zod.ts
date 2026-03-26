import {z} from 'zod'


const songInfo = z.object({
  "title": z.string(),
  "bvid": z.string(),
  "aid": z.number(),
  "name": z.string(),
  "producers": z.string(),
  "uploader": z.string(),
  "copyrightLabel": z.string(),
  "synthesizers": z.string(),
  "vocalists": z.string(),
  "songType": z.string(),
  "pubdate": z.string(),
  "duration": z.string(),
  "page": z.number(),
})

const stats = z.object({
  "view": z.number(),
  "favorite": z.number(),
  "coin": z.number(),
  "like": z.number(),
  "danmaku": z.number(),
  "reply": z.number(),
  "share": z.number(),
  "viewR": z.number(),
  "favoriteR": z.number(),
  "coinR": z.number(),
  "likeR": z.number(),
  "danmakuR": z.number(),
  "replyR": z.number(),
  "shareR": z.number(),
  "fixA": z.number(),
  "fixB": z.number(),
  "fixC": z.number(),
  "fixD": z.number(),
  "point": z.number(),
  "image_url": z.string(),
  "view_rank": z.number(),
  "favorite_rank": z.number(),
  "coin_rank": z.number(),
  "like_rank": z.number(),
  "danmaku_rank": z.number(),
  "reply_rank": z.number(),
  "share_rank": z.number(),
})

const appendix = z.object({
  showCount: z.boolean(),
  trendCount: z.number(),
  videoSource: z.string(),
  point: z.number(),
})

const ranks = z.object({
  "rank": z.number(),
  "count": z.number(),
  "rank_before": z.number(),
  "point_before": z.number(),
  "rate": z.string(),
})

export const weeklyMainSchema = songInfo.merge(stats).merge(appendix).merge(ranks).extend({
  "honor": z.array(z.string()),
  "seperate_ranks": z.record(z.string(), z.number()),
})


