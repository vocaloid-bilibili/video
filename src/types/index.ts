export type NumberOrNone = number | "-"


interface Appendix {
  showCount: boolean;
  trendKey: string;
  trendCount: number;
  videoSource: string;
  point: number;
}

export interface Stats {
  view:          number;
  favorite:      number;
  coin:          number;
  like:          number;
  danmaku:       number;
  reply:         number;
  share:         number;
  viewR:         number;
  favoriteR:     number;
  coinR:         number;
  likeR:         number;
  danmakuR:      number;
  replyR:        number;
  shareR:        number;
  fixA:          number;
  fixB:          number;
  fixC:          number;
  fixD:          number;
  point:         number;
  image_url:     string;
  view_rank:     number;
  favorite_rank: number;
  coin_rank:     number;
  like_rank:     number;
  danmaku_rank:  number;
  reply_rank:    number;
  share_rank:    number;
}


export interface WeeklyMain extends Appendix, Stats {
  title:         string;
  bvid:          string;
  aid:           number;
  name:          string;
  author:        string;
  uploader:      string;
  copyright:     number;
  synthesizer:   string;
  vocal:         string;
  type:          string;
  pubdate:       string;
  duration:      string;
  page:          number;

  rank:          number;
  count:         number;
  rank_before:   number | "-";
  point_before:  number | "-";
  rate:          string;
  honor:         any[];
  seperate_ranks:  { [key: string]: NumberOrNone };
}