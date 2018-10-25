const request = require("request");
const fs = require("fs");
const cheerio = require("cheerio");
//这个时间后面设置cookie需要用到
const formatTime = new Date()
  .toLocaleString()
  .replace(/\//g, "-")
  .replace(/[\u4E00-\u9FA5]/g, "");

function setOptions({ url, cookies, contentType }) {
  const jar = request.jar();
  jar.setCookie(request.cookie(cookies), url);
  return {
    url: url,
    jar: jar,
    method: "GET",
    headers: {
      Connection: "keep-alive",
      "Content-Type": contentType,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36"
    }
  };
}

// 拿到所有音频的ID
function getListIdsCallback(error, response, body) {
  if (!error && response.statusCode === 200) {
    const listIds = []; //存放所有音频ID的数组
    const $ = cheerio.load(body);
    $("div.album_soundlist > ul > li > div > a.title").each((index, item) => {
      listIds.push(
        $(item)
          .attr("href")
          .split("/")[3]
      );
    });
    getAudioJson(listIds); //获取音频真实链接并下载音频
  }
}

function getAudioJson(listIds) {
  if (listIds.length === 0) {
    return;
  }
  const id = listIds.shift();
  request(
    setOptions({
      url: `http://www.ximalaya.com/tracks/${id}.json`,
      cookies: `_xmLog=xm_1510364052559_j9unrdjjmwt7gx; login_from=qq; nickname=All2005; login_type=QQ; 1&remember_me=y; 1&_token=96575028&ecb632710362104767080ce01362b33cc881; trackType=web; x_xmly_traffic=utm_source%3A%26utm_medium%3A%26utm_campaign%3A%26utm_content%3A%26utm_term%3A%26utm_from%3A; Hm_lvt_4a7d8ec50cfd6af753c4f8aee3425070=1510364053; Hm_lpvt_4a7d8ec50cfd6af753c4f8aee3425070=1510376453; _ga=GA1.2.1519968795.1510364053; _gat=1; 1_l_flag=96575028&ecb632710362104767080ce01362b33cc881_${formatTime}; msgwarn=%7B%22category%22%3A%22%22%2C%22newMessage%22%3A0%2C%22newNotice%22%3A0%2C%22newComment%22%3A0%2C%22newQuan%22%3A0%2C%22newFollower%22%3A0%2C%22newLikes%22%3A0%7D`,
      contentType: "text/html;charset=utf-8"
    }),
    (error, response, body) => {
      return getAudioJsonCallback(error, response, body, listIds);
    }
  );
}

function getAudioJsonCallback(error, response, body, listIds) {
  if (!error && response.statusCode === 200) {
    const JsonData = JSON.parse(body);
    const id = listIds.shift(); //每次取出一个id去请求
    downloadFile(JsonData["play_path"], `${JsonData["id"]}.m4a`, (e) => {
      console.log(`${JsonData["id"]}下载完毕`);
      getAudioJson(listIds); //下载完后再次启动请求
    });
  }
}

function downloadFile(url, filename, callback) {
  const stream = fs.createWriteStream(filename);
  request(url)
    .pipe(stream)
    .on("close", callback);
}
