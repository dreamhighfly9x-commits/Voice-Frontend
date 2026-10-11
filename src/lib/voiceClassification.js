const useCases={narrative_story:['ke-chuyen','Kể chuyện'],conversational:['giong-doc-pho-thong','Giọng đọc phổ thông'],characters_animation:['hoat-hinh','Hoạt hình'],advertisement:['ban-hang-tiktok','Bán hàng tiktok'],informative_educational:['giong-doc-pho-thong','Giọng đọc phổ thông'],entertainment_tv:['thuyet-minh-phim','Thuyết minh phim'],news:['giong-doc-bao-phap-luat','Giọng đọc báo, pháp luật'],social_media:['hot-tiktok','Hot Tiktok']};
export function classifyVoice(v){
  const m=v.metadata||{};
  let categories=m.categories||[];
  const automatic=!categories.length;
  if(automatic){
    const text=`${v.name} ${m.description||''}`.toLowerCase();
    const inferred=[];
    for(const [pattern,key,name] of [[/podcast/,'podcast','Podcast'],[/audiobook|audio book|đọc truyện/,'doc-truyen','Đọc truyện'],[/storytell|narrat|kể chuyện/,'ke-chuyen','Kể chuyện'],[/advert|commercial|quảng cáo/,'ban-hang-tiktok','Bán hàng tiktok'],[/animation|cartoon|hoạt hình/,'hoat-hinh','Hoạt hình'],[/youtube/,'youtube-2','Youtube 2'],[/tiktok/,'tiktok-2','Tiktok 2'],[/horror|kinh dị/,'kinh-di','Kinh dị']])if(pattern.test(text))inferred.push({key,name});
    const fallback=useCases[m.use_case];
    categories=inferred.length?inferred:fallback?[{key:fallback[0],name:fallback[1]}]:[];
  }
  return {...v,age:v.age||m.age||'',accent:m.accent||'',desc:m.description||v.desc,categories,automatic};
}
