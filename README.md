# node-crawler

node 爬虫抓取喜马拉雅音乐

> 注意：接口地址可能会变，如果报错，请自行查找正确接口地址。

### 运行

```sh
# 可自行安装 ts-node 来启动文件
ts-node index.ts
```

```js
const page = [
  "https://www.ximalaya.com/revision/album/getTracksList?albumId=3690094&pageNum=1"
];
```

这里只请求了第一页的接口，如果请求多个页码，继续数组里增加接口即可，比如请求第二页:

```js
const page = [
  "https://www.ximalaya.com/revision/album/getTracksList?albumId=3690094&pageNum=1",
  "https://www.ximalaya.com/revision/album/getTracksList?albumId=3690094&pageNum=2"
];
```
