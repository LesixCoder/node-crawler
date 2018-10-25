import R from "request";
import * as cheerio from "cheerio";
import { createWriteStream } from "fs";
//这个时间后面设置cookie需要用到
const formatTime = new Date()
  .toLocaleString()
  .replace(/\//g, "-")
  .replace(/[\u4E00-\u9FA5]/g, "");

const page = [
  // "http://www.ximalaya.com/42612746/album/3690094?order=asc&page=1",
  // "http://www.ximalaya.com/42612746/album/3690094?order=asc&page=2"
  "https://www.ximalaya.com/revision/album/getTracksList?albumId=3690094&pageNum=1"
  // "https://www.ximalaya.com/revision/album/getTracksList?albumId=3690094&pageNum=2"
];

function countPage(url: string): Promise<{ pages: string[]; title: string }> {
  return new Promise((resolve, reject) => {
    const html = R.get(url, (err, res, body) => {
      const $ = cheerio.load(body);
      const linkBtnsDom = $(".pagingBar_page");
      const lastPageBtn = linkBtnsDom[linkBtnsDom.length - 2];
      url = url.replace(/\/$/, ""); // 去除末尾的 /
      // console.log(linkBtnsDom.val());
      const length = parseInt(linkBtnsDom.val()) || 1;
      const pages = Array.from(
        { length },
        (v, k) => url + "?order=desc&page=" + (1 + k)
      );
      const title = $(".detailContent_title h1")[0].children[0].data || url;
      resolve({ pages, title });
    });
  });
}

function getIDByURL(URL: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    R(URL, (err, res, body) => {
      // const $ = cheerio.load(body);
      // const doms = $(".sound-list > .rC5T").find("a");
      // const partIds = Array.from(doms).map((v, k) => {
      //   return v.attribs["href"].split("/")[3];
      // });
      body = JSON.parse(body);
      if (body.ret === 200) {
        const partIds = body.data.tracks.map((v: any) => {
          return v.trackId;
        });
        // console.log(partIds);
        resolve(partIds);
      }
    });
  });
}

function getIdsFromDom(dom: Cheerio) {
  return Array.from(dom).map((v, k) => {
    return v.attribs["href"];
  });
}

async function getIds() {
  const taskQ = page.map((v, k) => {
    return getIDByURL(v);
  });

  return await Promise.all(taskQ); // 页面不多直接一起并发爬
}

function download(id: string) {
  const uri = `http://www.ximalaya.com/tracks/${id}.json`;
  return new Promise((resolve, reject) => {
    R.get(uri, (error, res, body) => {
      // console.log(JSON.parse(body));
      if (error) reject(error);
      console.log("content-type:", res.headers["content-type"]);
      console.log("content-length:", res.headers["content-length"]);
      const obj = JSON.parse(body);
      const mediaURL: string = obj.play_path;
      const title: string = obj.title;
      console.log(`正在下载 《《${title}》》`);
      R.get(mediaURL, {
        headers: {
          "Content-Type": "application/octet-stream"
        }
      })
        .pipe(
          createWriteStream(`./audio/${title}.m4a`).on("error", console.error)
        )
        .on("error", console.error)
        .on("close", () => console.log(`${title}下载完成`));
    });
  });
}

function saveMp3File(URL: string, title: string) {
  R.get(URL, {
    headers: {
      "Content-Type": "application/octet-stream"
    }
  })
    .pipe(createWriteStream(`./audio/${title}.m4a`).on("error", console.error))
    .on("error", console.error)
    .on("close", () => console.log(`${title}下载完成`));
}

async function run() {
  // let [id1, id2] = await getIds();
  let [id1] = await getIds();
  // let ids = id1.concat(id2);
  // console.log(id1);

  let ids = id1;

  for (var i = 0; i <= ids.length; i++) {
    // let log = await download(ids[i]);
    Promise.all([download(ids[i])]).catch(console.error);
    // console.log(log);
  }
}

run();
