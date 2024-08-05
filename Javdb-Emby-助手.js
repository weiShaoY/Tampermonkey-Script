// ==UserScript==
// @name         Javdb-Emby-助手
// @version      1.0.0
// @author       少爷
// @description  Javdb-Emby-助手
// @license      MIT
// @icon         https://www.javdb.com/favicon.ico
// @match        https://*.javdb.com/*
// @match        *://*.javdb.com/*
// @include      */web/index.html
// @connect      jable.tv
// @connect      missav.com
// @connect      javhhh.com
// @connect      netflav.com
// @connect      avgle.com
// @connect      bestjavporn.com
// @connect      jav.guru
// @connect      javmost.cx
// @connect      hpjav.tv
// @connect      av01.tv
// @connect      javbus.com
// @connect      javmenu.com
// @connect      javfc2.net
// @connect      paipancon.com
// @connect      ggjav.com
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      192.168.0.4

// ==/UserScript==

;(function () {
  'use strict'
  /* globals jQuery, $, waitForKeyElements */

  // name: 脚本的名称"。
  // version: 脚本的版本，当前为1.0.0。
  // description: 对脚本的简要描述。
  // license: 脚本的许可协议，MIT。
  // icon: 脚本图标的URL，用于在用户脚本管理器中显示。
  // include 和 @match: 定义了脚本将在哪些URL上运行。@include使用了正则表达式，匹配所有符合条件的Javdb网站。
  // connect: 允许脚本与指定的域名进行跨域请求。列出了一系列可以连接的网站。
  // grant: 指定脚本可以使用的GM（Greasemonkey）API功能，这里是添加样式和进行XMLHttpRequest请求。
  // include      /^https:\/\/(\w*\.)?javdb(\d)*\.com.*$/

  /**
   *  Emby 配置
   */
  let embyConfig = {
    /**
     * Emby 服务器的 URL。
     */
    url: 'http://192.168.0.4:8096',
    /**
     * Emby 服务器用户 ID。
     */
    userId: 'bd743a8bac9247fb9f5cad8b08945906',

    /**
     * 发起请求的设备名称。
     */
    deviceName: 'Chrome Windows',

    /**
     * 发起请求设备的 ID。
     */
    deviceId: 'aa94db6f-fb2d-48d8-a6e1-6b67b3d90036',

    /**
     * Emby 客户端的版本号。
     */
    clientVersion: '4.8.8.0',

    /**
     * Emby 服务器使用的语言代码。
     */
    language: 'zh-cn',

    /**
     * 用户的认证令牌。
     */
    token: 'abcc5517089e4e28bf46d4cd3e3a74b9',

    /**
     * 发送到 Emby 服务器的查询字符串参数。
     */
    queryParams: {
      /**
       * 搜索词。
       */
      SearchTerm: '',

      /**
       * 指定返回的字段列表。
       */
      Fields:
        'BasicSyncInfo,CanDelete,PrimaryImageAspectRatio,ProductionYear,Status,EndDate',

      /**
       * 查询结果的起始索引。
       * @type {number}
       */
      StartIndex: 0,

      /**
       * 指定排序的字段。
       */
      SortBy: 'SortName',

      /**
       * 排序的顺序（升序或降序）。
       */
      SortOrder: 'Ascending',

      /**
       * 启用的图像类型。
       */
      EnableImageTypes: 'Primary,Backdrop,Thumb',

      /**
       * 每种类型的图像数量限制。
       */
      ImageTypeLimit: 1,

      /**
       * 是否递归查询子项。
       */
      Recursive: true,

      /**
       * 是否按系列分组节目。
       */
      GroupProgramsBySeries: true,

      /**
       * 返回结果的最大数量。
       */
      Limit: 50
    }
  }

  /**
   * Btsow  网址
   */
  const btsowUrl = 'https://btsow.com/search/'
  /**
   *   视频扩展名
   */
  const videoExtensionArray = ['mp4', 'mkv', 'avi', 'flv', 'wmv', 'mov', 'rmvb']

  /**
   *  视频标签
   */
  const videoTagArray = ['-c', '-破解', '-破解-c', '-4k', '-4K-破解']

  /**
   *  视频标签正则
   */
  const videoTagRegex = new RegExp(videoTagArray.join('|'), 'gi')

  /**
   *   加载动画
   */
  const LoadingGif = {
    /**
     *    加载动画的元素
     */
    element: null,

    /**
     *  启动加载动画
     */
    start: function () {
      if (!this.element) {
        this.element = document.createElement('img')
        this.element.src =
          'https://upload.wikimedia.org/wikipedia/commons/3/3a/Gray_circles_rotate.gif'
        this.element.alt = '读取文件夹中...'
        Object.assign(this.element.style, {
          position: 'fixed',
          bottom: '0',
          left: '50px',
          zIndex: '1000',
          width: '40px',
          height: '40px',
          padding: '5px'
        })
        document.body.appendChild(this.element)
      }
    },

    /**
     *   停止加载动画
     */
    stop: function () {
      if (this.element) {
        document.body.removeChild(this.element)
        this.element = null
      }
    }
  }

  /**
   * 从 localStorage 获取 nfoFiles
   * @returns {Array} nfoFiles 数组
   */
  function getNfoFiles() {
    const nfoFilesJson = localStorage.getItem('nfoFiles')
    const aaa = JSON.parse(nfoFilesJson)
    console.log('%c Line:107 🍭 aaa', 'color:#2eafb0', aaa)

    return nfoFilesJson ? JSON.parse(nfoFilesJson) : null
  }

  /**
   *  网页原始样式处理
   */
  const OriginalStyleHandler = function () {
    // 网页删除 id为footer的元素
    const footerElement = document.getElementById('footer')
    if (footerElement) {
      footerElement.remove()
    }

    // 删除类名为 sub-header 的元素
    const subHeaderElement = document && document.querySelector('.sub-header')
    if (subHeaderElement) {
      subHeaderElement.remove()
    }
  }

  /**
   *   本地文件夹处理函数
   */
  const LocalFolderHandler = (function () {
    class LocalFolderHandlerClass {
      constructor() {
        this.nfoFileNamesSet = new Set()
        this.initButton()
      }

      /**
       * 创建一个按钮元素并添加到页面中
       */
      initButton() {
        const button = this.createButtonElement()
        button.addEventListener('click', this.handleButtonClick.bind(this))
        document.body.appendChild(button)
      }

      /**
       * 创建一个按钮元素
       * @returns {HTMLButtonElement}
       */
      createButtonElement() {
        const button = document.createElement('button')
        button.innerHTML = '仓'

        Object.assign(button.style, {
          color: '#fff',
          backgroundColor: '#FF8400',
          borderColor: '#FF8400',
          borderRadius: '5px',
          position: 'fixed',
          bottom: '2px',
          left: '2px',
          zIndex: '1000',
          padding: '5px 10px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        })

        return button
      }

      /**
       * 按钮点击事件处理函数
       */
      async handleButtonClick() {
        this.nfoFileNamesSet.clear()

        const directoryHandle = await window.showDirectoryPicker()
        console.log(
          '%c Line:90 🍖 directoryHandle',
          'color:#42b983',
          directoryHandle.name
        )

        if (!directoryHandle) {
          alert('获取本地信息失败')
          return
        }

        const startTime = Date.now()
        LoadingGif.start()

        for await (const fileData of this.getFiles(directoryHandle, [
          directoryHandle.name
        ])) {
          const file = await fileData.fileHandle.getFile()

          const videoFullName = await this.findVideoFileName(
            fileData.parentDirectoryHandle
          )

          const item = {
            /**
             *  视频名称 (去除扩展名)
             */
            videoName: file.name.substring(0, file.name.length - '.nfo'.length),

            /**
             *  视频完整名称 (包含扩展名)
             */
            videoFullName: videoFullName,

            /**
             *  视频处理后的名称 (去除扩展名，去除视频标签，转换为小写)
             */
            videoProcessedName: this.processFileName(file.name),

            /**
             *  视频文件标签名
             */
            videoTagName: this.getVideoTagName(videoFullName),

            /**
             *  视频扩展名
             */
            videoExtensionName: videoFullName.replace(/^.*\./, ''),

            /**
             *  目录结构
             */
            directoryStructure: [...fileData.folderNames, videoFullName],

            /**
             *  是否为中文字幕
             */
            isChineseSubtitle:
              videoFullName.includes('-c') || videoFullName.includes('-C')
          }

          this.nfoFileNamesSet.add(item)
        }

        const str = JSON.stringify(Array.from(this.nfoFileNamesSet))
        localStorage.setItem('nfoFiles', str)

        const endTime = Date.now()
        const time = ((endTime - startTime) / 1000).toFixed(2)

        onBeforeMount()

        LoadingGif.stop()

        alert(
          `读取文件夹: '${directoryHandle.name}' 成功，耗时 ${time} 秒, 共读取 ${this.nfoFileNamesSet.size} 个视频。`
        )
      }

      /**
       * 递归获取目录下的所有文件
       * @param {FileSystemDirectoryHandle} directoryHandle - 当前目录句柄
       * @param {string[]} folderNames - 目录名数组
       * @returns {AsyncGenerator}
       */
      async *getFiles(directoryHandle, folderNames = []) {
        for await (const entry of directoryHandle.values()) {
          try {
            //  如果是文件并且后缀是.nfo，则yield数据
            if (entry.kind === 'file' && entry.name.endsWith('.nfo')) {
              yield {
                fileHandle: entry,
                folderNames: [...folderNames],
                parentDirectoryHandle: directoryHandle
              }
            }
            //  如果是文件夹，则递归获取文件
            else if (entry.kind === 'directory') {
              yield* this.getFiles(entry, [...folderNames, entry.name])
            }
          } catch (e) {
            console.error(e)
          }
        }
      }

      /**
       * 查找视频文件名
       * @param {FileSystemDirectoryHandle} directoryHandle - 当前目录句柄
       * @returns {Promise<string>} 找到的视频文件名或空字符串
       */
      async findVideoFileName(directoryHandle) {
        for await (const entry of directoryHandle.values()) {
          if (entry.kind === 'file') {
            // 使用数组中的扩展名来检查文件名
            const extension = videoExtensionArray.find((ext) =>
              entry.name.endsWith(`.${ext}`)
            )
            if (extension) {
              return entry.name
            }
          }
        }
        return ''
      }
      /**
       * 处理文件名
       * 去掉 '.nfo'、'-c'、'-C' 和 '-破解' 后缀，并转换为小写
       * @param {string} fileName - 原始文件名
       * @returns {string} 处理后的文件名
       */
      processFileName(fileName) {
        // 移除文件扩展名
        let processedName = fileName
          .substring(0, fileName.length - '.nfo'.length)
          .toLowerCase()
          .replace(videoTagRegex, '')
        return processedName
      }

      /**
       *  获取视频标签名
       *  @param {string} 视频完整名称 (包含扩展名)
       */
      getVideoTagName(videoFullName) {
        const foundTags = [...videoFullName.matchAll(videoTagRegex)]

        if (foundTags.length > 0) {
          // 如果找到多个标签，可以选择只返回第一个，或者根据需要调整
          return foundTags.map((match) => match[0]) // 返回所有找到的标签
          // 或者只返回第一个找到的标签
          // return foundTags[0][0];
        } else {
          return ['无']
        }
      }
    }

    return function () {
      new LocalFolderHandlerClass()
    }
  })()

  /**
   * 列表页处理函数
   */
  const ListPageHandler = (function () {
    /**
     * 创建 btsow 搜索按钮
     * @param {HTMLElement} ele 要添加的所在的元素
     * @param {string} videoTitle 视频标题
     */
    function createBtsowBtn(ele, videoTitle) {
      if (ele.querySelector('.btsow-btn')) {
        return
      }

      const btsowBtnElement = document.createElement('div')
      btsowBtnElement.className = 'tag btsow-btn'
      btsowBtnElement.textContent = 'Btsow'

      Object.assign(btsowBtnElement.style, {
        marginLeft: '10px',
        color: '#fff',
        backgroundColor: '#FF8400'
      })

      btsowBtnElement.addEventListener('click', function (event) {
        event.preventDefault()
        window.open(`${btsowUrl}${videoTitle}`, '_blank')
      })

      ele.querySelector('.tags').appendChild(btsowBtnElement)
    }

    /**
     * 创建在 Emby 搜索按钮
     * @param {HTMLElement} ele 要添加的所在的元素
     */
    function createEmbyBtn(ele, videoTitle) {
      if (ele.querySelector('.emby-btn')) {
        return
      }

      const openEmbyBtnElement = document.createElement('div')
      openEmbyBtnElement.className = 'tag emby-btn'
      openEmbyBtnElement.textContent = 'Emby'

      Object.assign(openEmbyBtnElement.style, {
        marginLeft: '10px',
        color: '#fff',
        backgroundColor: '#52B54B'
      })

      openEmbyBtnElement.addEventListener('click', function (event) {
        event.preventDefault()
        GM_setValue('EMBY-BTN-VALUE', videoTitle)

        /**
         * 构建 Emby 请求 URL
         * @param {Object} config - Emby 配置
         * @param {Object} params - 查询参数
         * @returns {string} - 完整的请求 URL
         */
        const buildEmbyRequestUrl = (embyConfig) => {
          const queryParams = {
            ...embyConfig.queryParams,
            SearchTerm: videoTitle
          }
          const queryString = Object.entries(queryParams)
            .map(
              ([key, value]) =>
                `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
            )
            .join('&')

          return `${embyConfig.url}/emby/Users/${embyConfig.userId}/Items?${queryString}`
        }

        GM_xmlhttpRequest({
          method: 'GET',
          url: buildEmbyRequestUrl(embyConfig),
          headers: {
            Accept: 'application/json',
            'X-Emby-Client': 'Emby Web',
            'X-Emby-Device-Name': embyConfig.deviceName,
            'X-Emby-Device-Id': embyConfig.deviceId,
            'X-Emby-Client-Version': embyConfig.clientVersion,
            'X-Emby-Token': embyConfig.token,
            'X-Emby-Language': embyConfig.language
          },
          onload: (response) => {
            if (response.status >= 200 && response.status < 300) {
              try {
                // 将 JSON 字符串转换为 JSON 对象
                const result = JSON.parse(response.responseText)

                if ((result.Items.length = 1)) {
                  const id = result.Items[0].Id
                  const serverId = result.Items[0].ServerId
                  window.open(
                    `${embyConfig.url}/web/index.html#!/item?id=${id}&serverId=${serverId}`,
                    '_blank'
                  )
                  GM_setValue('EMBY-BTN-VALUE', '')
                } else {
                  GM_setValue('EMBY-BTN-VALUE', videoTitle)
                  window.open(
                    `${embyConfig.url}/web/index.html#!/home`,
                    '_blank'
                  )
                }
              } catch (e) {
                console.error('请求失败:', e)
              }
            } else {
              console.error(`HTTP 错误: ${response.status}`)
            }
          },
          onerror: (error) => {
            console.error('Request failed:', error)
          }
        })
      })

      ele.querySelector('.tags').appendChild(openEmbyBtnElement)
    }

    /**
     * 设置 .box 背景色
     */
    function highlightBox(ele) {
      const imgElement = ele.querySelector('.box')

      imgElement.style.padding = '10px'

      imgElement.style.backgroundColor = '#ff9f9f'
    }

    /**
     * 显示已经下载的影片名
     * @param {HTMLElement} ele 元素
     * @param {Object} item 影片项
     * @param {number} count 索引
     */
    function showDownloadedVideoTitle(ele, item, count) {
      if (count === 0) {
        // 第一次循环 先清除干净
        ele
          .querySelector('.box')
          .querySelectorAll('.down-loaded-video-title')
          .forEach(function (ele) {
            ele.remove()
          })
      }

      /**
       *  已经下载的影片名
       */
      const downloadedVideoTitleElement = document.createElement('div')

      downloadedVideoTitleElement.className = 'down-loaded-video-title'

      downloadedVideoTitleElement.textContent = item.videoName

      Object.assign(downloadedVideoTitleElement.style, {
        margin: '1rem 0',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        color: '#fff',
        fontSize: '.75rem',
        height: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '5px'
      })

      downloadedVideoTitleElement.addEventListener('click', function () {
        event.preventDefault()

        navigator.clipboard.writeText(item.videoName)
        downloadedVideoTitleElement.textContent = item.videoName + ' 复制成功'
      })

      //  判断当前项是否存在 meta-buttons 元素 如果存在就添加到 meta-buttons的第一个位置

      if (ele.querySelector('.meta-buttons')) {
        ele
          .querySelector('.meta-buttons')
          .insertBefore(
            downloadedVideoTitleElement,
            ele.querySelector('.meta-buttons').firstChild
          )
      } else {
        ele.querySelector('.box').appendChild(downloadedVideoTitleElement)
      }
    }

    /**
     *  添加提示更新中文磁链按钮
     *  @param {HTMLElement} ele 元素
     *  @param {Object} item 影片项
     *  @description 没有包含 -c 或者 -C  并且页面已经提示 含中文磁链的时候 添加一个提示更新的按钮
     */
    function createUpdateChineseTorrentBtn(ele) {
      if (ele.querySelector('.update-chinese-torrent-btn')) {
        return
      }

      /**
       *  提示更新中文磁链按钮
       */
      const updateChineseTorrentBtnElement = document.createElement('div')

      updateChineseTorrentBtnElement.className = 'update-chinese-torrent-btn'

      updateChineseTorrentBtnElement.textContent = '可更新中文磁链'

      Object.assign(updateChineseTorrentBtnElement.style, {
        margin: '1rem 0',
        backgroundColor: '#fff',
        color: '#000',
        fontSize: '.75rem',
        height: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '5px'
      })

      //@ (我的清单) 判断当前项是否存在 meta-buttons 元素 如果存在就添加到 meta-buttons的第一个位置
      if (ele.querySelector('.meta-buttons')) {
        ele
          .querySelector('.meta-buttons')
          .insertBefore(
            updateChineseTorrentBtnElement,
            ele.querySelector('.meta-buttons').firstChild
          )
      } else {
        //@ (普通列表) 添加到 tags 不是他里面的 后 第一个位置
        // 获取 .tags 元素
        const tagsElement = ele.querySelector('.tags')

        // 如果 .tags 元素存在
        if (tagsElement) {
          // 获取 .tags 元素的下一个兄弟节点
          const nextElement = tagsElement.nextElementSibling

          // 如果存在下一个兄弟节点，则在它之前插入按钮
          if (nextElement) {
            ele
              .querySelector('.box')
              .insertBefore(updateChineseTorrentBtnElement, nextElement)
          } else {
            // 如果没有下一个兄弟节点，则将按钮添加到容器末尾
            ele
              .querySelector('.box')
              .appendChild(updateChineseTorrentBtnElement)
          }
        }
      }
    }

    /**
     * 处理列表页逻辑
     */
    function handler() {
      const nfoFilesArray = getNfoFiles()
      if (!nfoFilesArray) {
        return
      }

      LoadingGif.start()

      $('.movie-list .item').each(function (index, ele) {
        const videoTitle = ele.querySelector('strong').innerText.toLowerCase()

        createBtsowBtn(ele, videoTitle)

        /**
         *  递增索引变量
         */
        let count = 0

        /**
         *  页面列表当前影片是否含中文磁链
         */
        const isVideoHaveChineseTorrent = !!ele.querySelector('.is-warning')

        /**
         *  Emby中已经存在的影片是否含中文磁链
         */
        let isEmbyHaveChineseTorrent = false

        nfoFilesArray.forEach(function (item) {
          if (item.videoProcessedName.includes(videoTitle)) {
            highlightBox(ele)
            createEmbyBtn(ele, videoTitle)
            showDownloadedVideoTitle(ele, item, count)

            // 递增索引变量
            count++

            // 当前项的videoName 是否为 -c 或者 -C 结尾  如果是则说明当前项为中文磁链
            if (item.isChineseSubtitle) {
              isEmbyHaveChineseTorrent = true
            }
          }
        })

        //  如果当前影片有中文磁链可用并且和 Emby中已经存在的影片没有中文磁链 则 添加提示更新中文磁链按钮
        if (isVideoHaveChineseTorrent && !isEmbyHaveChineseTorrent && count) {
          createUpdateChineseTorrentBtn(ele)
        }
      })

      LoadingGif.stop()
    }

    return handler
  })()

  /**
   * 详情页处理函数
   */
  const DetailPageHandler = (function () {
    /**
     * 获取页面视频标题
     * @returns {string} 视频标题文本
     */
    function getVideoTitle() {
      // return $('.video-detail strong').first().text().trim().toLowerCase() || ''
      // 获取页面上所有的 strong 元素，这些元素必须是 video-detail 类的子元素
      const strongElements = document.querySelectorAll('.video-detail strong')

      // 检查是否找到了至少一个元素
      if (strongElements.length > 0) {
        // 获取第一个 strong 元素的文本内容
        const titleText =
          strongElements[0].textContent || strongElements[0].innerText // 兼容旧版IE

        // 去除文本两端的空白字符，并转换为小写
        return titleText.trim().toLowerCase()
      }

      // 如果没有找到元素，返回空字符串
      return ''
    }

    /**
     * 设置 .video-meta-panel 背景色
     */
    function highlightVideoPanel() {
      $('.video-meta-panel').css({ backgroundColor: '#FFC0CB' })
    }

    /**
     * 显示已经下载的影片名
     * @returns {HTMLElement} localFolderTitleListElement 元素
     */
    function showDownloadedVideoTitleList() {
      /**
       *  已经下载的影片名列表
       */
      let downloadedVideoTitleListElement = document.querySelector(
        '.downloadedVideoTitleListElement'
      )

      if (!downloadedVideoTitleListElement) {
        downloadedVideoTitleListElement = document.createElement('div')

        downloadedVideoTitleListElement.className =
          'downloadedVideoTitleListElement'

        downloadedVideoTitleListElement.textContent = 'Emby已存在影片'

        Object.assign(downloadedVideoTitleListElement.style, {
          color: '#fff',
          backgroundColor: '#FF8400',
          borderRadius: '5px',
          fontSize: '16px',
          fontWeight: 'bold',
          position: 'fixed',
          left: '5px',
          top: '200px'
        })

        document.body.appendChild(downloadedVideoTitleListElement)
      }
      return downloadedVideoTitleListElement
    }

    /**
     * 添加已经下载的影片名列表
     * @param {Object} item 影片项
     * @param {number} count 索引
     */
    function addDownLocalVideoTitleList(item, count) {
      if (count === 0) {
        // 第一次循环 先清除干净
        showDownloadedVideoTitleList().innerHTML = ''
      }

      /**
       *  已经下载的影片名列表
       */
      const downloadedVideoTitleListElement = showDownloadedVideoTitleList()

      /**
       *  每一部已经下载的影片
       */
      const downloadedVideoTitleListItem = document.createElement('div')

      downloadedVideoTitleListItem.className = 'downloadedVideoTitleListItem'

      Object.assign(downloadedVideoTitleListItem.style, {
        color: '#fff',
        backgroundColor: '#17D1C6',
        borderRadius: '5px',
        fontSize: '16px',
        fontWeight: 'bold',
        height: '35px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 10px',
        borderRadius: '5px',
        width: '220px',
        margin: '10px'
      })

      const titleElement = document.createElement('div')

      titleElement.textContent = item.videoName

      Object.assign(titleElement.style, {
        with: '130px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      })

      downloadedVideoTitleListItem.appendChild(titleElement)

      downloadedVideoTitleListItem.addEventListener('click', function () {
        navigator.clipboard.writeText(item.videoProcessedName)
        if (downloadedVideoTitleListItem.children.length < 2) {
          const div = document.createElement('div')
          div.textContent = '复制成功'
          downloadedVideoTitleListItem.appendChild(div)
        }
      })

      // 将每一项添加到列表
      downloadedVideoTitleListElement.appendChild(downloadedVideoTitleListItem)
    }

    /**
     * 排序种子列表
     */
    function sortBtList() {
      const magnetsContent = document.getElementById('magnets-content')
      if (!magnetsContent?.children.length) return

      const items = Array.from(magnetsContent.querySelectorAll('.item'))

      items.forEach(function (item) {
        const metaSpan = item.querySelector('.meta')
        if (metaSpan) {
          const metaText = metaSpan.textContent.trim()
          const match = metaText.match(/(\d+(\.\d+)?)GB/)
          const size = match ? parseFloat(match[1]) : 0
          item.dataset.size = size
        }
      })

      items.sort(function (a, b) {
        return b.dataset.size - a.dataset.size
      })

      const priority = {
        high: [],
        medium: [],
        low: []
      }

      items.forEach(function (item) {
        const nameSpan = item.querySelector('.name')
        if (nameSpan) {
          const nameText = nameSpan.textContent.trim()

          if (/(-c| -C)/i.test(nameText)) {
            priority.high.push(item)
            item.style.backgroundColor = '#FFCCFF'
          } else if (!/[A-Z]/.test(nameText)) {
            priority.medium.push(item)
            item.style.backgroundColor = '#FFFFCC'
          } else {
            priority.low.push(item)
          }
        }
      })

      magnetsContent.innerHTML = ''

      priority.high.forEach(function (item) {
        magnetsContent.appendChild(item)
      })
      priority.medium.forEach(function (item) {
        magnetsContent.appendChild(item)
      })
      priority.low.forEach(function (item) {
        magnetsContent.appendChild(item)
      })
    }

    /**
     *  添加提示更新中文磁链按钮
     *  @description 没有包含 -c 或者 -C  并且页面已经提示 含中文磁链的时候 添加一个提示更新的按钮
     */
    function createUpdateChineseTorrentBtn() {
      if (document.querySelector('.update-chinese-torrent-btn')) {
        return
      }

      /**
       *  提示更新中文磁链按钮
       */
      const updateChineseTorrentBtnElement = document.createElement('div')

      updateChineseTorrentBtnElement.className = 'update-chinese-torrent-btn'

      updateChineseTorrentBtnElement.textContent = '可更新中文磁链'

      Object.assign(updateChineseTorrentBtnElement.style, {
        color: '#946C00',
        backgroundColor: '#FFFAEB',
        border: '1px solid #946C00',
        padding: '5px 10px',
        borderRadius: '5px',
        fontSize: '16px',
        fontWeight: 'bold',
        position: 'fixed',
        left: '5px',
        top: '150px',
        width: '140px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      })

      document.body.appendChild(updateChineseTorrentBtnElement)
    }

    /**
     * 主函数，处理详情页逻辑
     */
    function handler() {
      const videoTitle = getVideoTitle()
      if (!videoTitle) return

      const nfoFiles = getNfoFiles()
      if (!nfoFiles) return

      LoadingGif.start()

      /**
       *  递增索引变量
       */
      let count = 0

      /**
       *  页面列表当前影片是否含中文磁链
       */
      const isVideoHaveChineseTorrent = !!document.querySelector('.is-warning')

      /**
       *  Emby中已经存在的影片是否含中文磁链
       */
      let isEmbyHaveChineseTorrent = false

      nfoFiles.forEach(function (item) {
        if (item.videoProcessedName.includes(videoTitle)) {
          highlightVideoPanel()

          addDownLocalVideoTitleList(item, count)
          count++

          // 当前项是中文字幕 如果是则说明当前项为中文磁链
          if (item.isChineseSubtitle) {
            isEmbyHaveChineseTorrent = true
          }
        }
      })

      //  如果当前影片有中文磁链可用并且和 Emby中已经存在的影片没有中文磁链 则 添加提示更新中文磁链按钮
      if (isVideoHaveChineseTorrent && !isEmbyHaveChineseTorrent && count) {
        createUpdateChineseTorrentBtn()
      }

      sortBtList()

      LoadingGif.stop()
    }

    return handler
  })()

  /**
   * Emby查找重复视频处理函数
   */
  const EmbyFindDuplicateVideoHandler = (function () {
    /**
     * 找出具有相同属性值的重复项
     * @param {Array} items - 要处理的数组
     * @param {string} property - 用于比较的属性名
     * @returns {Array} result - 具有重复项的新数组
     */
    function findDuplicatesByProperty(items, property) {
      const propertyMap = {}
      const duplicates = []

      items.forEach((item) => {
        const key = item[property]
        if (!propertyMap[key]) {
          propertyMap[key] = []
        }
        propertyMap[key].push(item)
      })

      for (const key in propertyMap) {
        if (propertyMap[key].length > 1) {
          duplicates.push(...propertyMap[key])
        }
      }

      return duplicates
    }

    /**
     * 获取具有重复 videoProcessedName 的项并去重
     * @param {Array} items - 要处理的数组
     * @returns {Array} uniqueVideoProcessedNames - 去重后的 videoProcessedName 数组
     */
    function getUniqueVideoProcessedName(items) {
      const videoProcessedNameMap = {}
      const uniqueVideoProcessedNames = []

      // 遍历每个项，将具有重复 videoProcessedName 的项存储在映射中
      items.forEach((item) => {
        const key = item.videoProcessedName
        if (!videoProcessedNameMap[key]) {
          videoProcessedNameMap[key] = []
        }
        videoProcessedNameMap[key].push(item)
      })

      // 遍历映射，找出具有重复 videoProcessedName 的项并去重
      for (const key in videoProcessedNameMap) {
        if (videoProcessedNameMap[key].length > 1) {
          uniqueVideoProcessedNames.push(key)
        }
      }

      return uniqueVideoProcessedNames
    }

    /**
     * 主函数，处理筛选重复项逻辑
     */
    function handleDuplicates() {
      const nfoFiles = getNfoFiles()
      if (!nfoFiles) return

      /**
       *  所有重复的影片
       */
      const allDuplicates = findDuplicatesByProperty(
        nfoFiles,
        'videoProcessedName'
      )
      console.log(
        '%c Line:848 🍅 所有重复的影片, 共 ' + allDuplicates.length + ' 个',
        'color:#fca650',
        allDuplicates
      )

      /**
       *  Emby去重的影片标题
       */
      const EmbyRemovesDuplicateVideoTitle =
        getUniqueVideoProcessedName(nfoFiles)
      console.log(
        '%c Line:898 🥚 Emby重复的影片标题, 共' +
          EmbyRemovesDuplicateVideoTitle.length +
          '个',
        'color:#b03734',
        EmbyRemovesDuplicateVideoTitle
      )

      // 弹出提示框
      // alert(`共发现${allDuplicates.length}个重复项，
      // 共${EmbyRemovesDuplicateVideoTitle.length}个去重后的影片标题，
      // 请查看控制台！`)
    }

    return handleDuplicates
  })()

  /**
   *  搜索本地指定文件夹
   */
  function SearchLocalFolder(videoName) {
    const nfoFiles = getNfoFiles()
    if (!nfoFiles) return

    const arr = []

    nfoFiles.forEach(function (item) {
      if (item.videoFullName.toLowerCase().includes(videoName.toLowerCase())) {
        arr.push(item)
      }
    })
    console.log('%c Line:990 🌰 arr', 'color:#6ec1c2', arr)
  }

  /**
   *  在Emby中搜索
   */
  function EmbyListPageSearch() {
    const embyBtnValue = GM_getValue('EMBY-BTN-VALUE')

    console.log('%c Line:998 🍔 embyBtnValue', 'color:#93c0a4', embyBtnValue)

    if (!embyBtnValue) {
      console.log('没有获取到 embyBtnValue，直接返回')
      return
    }

    // 页面加载完成后执行
    window.addEventListener('load', () => {
      // 延时以确保所有元素都已加载
      setTimeout(() => {
        // 获取输入框元素
        const inputElement = document.querySelector(
          'input[is="emby-input"][type="search"]'
        )

        if (inputElement) {
          console.log('输入框已找到')
          // 设置输入框的值
          inputElement.value = embyBtnValue

          // 创建并触发回车事件
          inputElement.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles: true,
              cancelable: true,
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              charCode: 13
            })
          )

          console.log('回车事件已触发')
          GM_setValue('EMBY-BTN-VALUE', '')
        } else {
          console.log('输入框未找到')
        }

        // 清空值，无论找到与否
        GM_setValue('EMBY-BTN-VALUE', '')
      }, 2000) // 延时2秒
    })
  }

  /**
   *  页面加载前执行
   */
  async function onBeforeMount() {
    EmbyListPageSearch()

    // 网页原始样式处理
    OriginalStyleHandler()

    // 立即调用以初始化按钮和事件处理程序
    LocalFolderHandler()

    // 调用列表页处理函数
    ListPageHandler()

    // 调用详情页处理函数
    DetailPageHandler()

    // 调用 Emby重复视频处理函数
    EmbyFindDuplicateVideoHandler()

    //  搜索本地指定文件夹
    SearchLocalFolder('MDON-046')
  }

  onBeforeMount()
})()
