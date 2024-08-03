// ==UserScript==
// @name         Javdb-Emby-助手
// @version      1.0.0
// @author       少爷
// @description  Javdb-Emby-助手
// @license      MIT
// @icon         https://www.javdb.com/favicon.ico
// @match        https://*.javdb.com/*
// @match        *://*.javdb.com/*
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
            originalFileName: file.name.substring(
              0,
              file.name.length - '.nfo'.length
            ),
            transformedName: this.processFileName(file.name),
            videoFullName: videoFullName,
            hierarchicalStructure: [...fileData.folderNames, videoFullName]
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
            if (entry.kind === 'file' && entry.name.endsWith('.nfo')) {
              yield {
                fileHandle: entry,
                folderNames: [...folderNames],
                parentDirectoryHandle: directoryHandle
              }
            } else if (entry.kind === 'directory') {
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
          if (
            entry.kind === 'file' &&
            (entry.name.endsWith('.mp4') ||
              entry.name.endsWith('.mkv') ||
              entry.name.endsWith('.avi') ||
              entry.name.endsWith('.flv') ||
              entry.name.endsWith('.wmv') ||
              entry.name.endsWith('.mov') ||
              entry.name.endsWith('.rmvb'))
          ) {
            return entry.name
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
        let processedName = fileName.substring(
          0,
          fileName.length - '.nfo'.length
        )
        processedName = processedName.replace(/-c$/i, '')
        processedName = processedName.replace(/-破解$/i, '')
        return processedName.toLowerCase()
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
     * @type {string} btsow 搜索 URL 基础路径
     */
    const btsowUrl = 'https://btsow.com/search/'

    /**
     * 获取本地存储的 nfo 文件名的 JSON 字符串
     * @returns {string[]|null} nfo 文件名数组或 null
     */
    function getNfoFiles() {
      const nfoFilesJson = localStorage.getItem('nfoFiles')
      return nfoFilesJson ? JSON.parse(nfoFilesJson) : null
    }

    /**
     * 创建 btsow 搜索视频按钮
     * @param {HTMLElement} ele 要添加的所在的元素
     * @param {string} videoTitle 视频标题
     */
    function createBtsowBtn(ele, videoTitle) {
      if (ele.querySelector('.btsow')) {
        return
      }

      const btsowBtnElement = document.createElement('div')
      btsowBtnElement.className = 'tag btsow'
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
     * 创建本地打开视频所在文件夹按钮
     * @param {HTMLElement} ele 要添加的所在的元素
     */
    function createOpenLocalFolderBtn(ele) {
      if (ele.querySelector('.open_local_folder')) {
        return
      }

      const openLocalFolderBtnElement = document.createElement('div')
      openLocalFolderBtnElement.className = 'tag open_local_folder'
      openLocalFolderBtnElement.textContent = '本地打开'

      Object.assign(openLocalFolderBtnElement.style, {
        marginLeft: '10px',
        color: '#fff',
        backgroundColor: '#F8D714'
      })

      openLocalFolderBtnElement.addEventListener('click', function (event) {
        event.preventDefault()
        const localFolderPath = 'Z:\\日本'
        // 打开本地文件夹逻辑
      })

      ele.querySelector('.tags').appendChild(openLocalFolderBtnElement)
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

      downloadedVideoTitleElement.textContent = item.originalFileName

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

        navigator.clipboard.writeText(item.originalFileName)
        downloadedVideoTitleElement.textContent =
          item.originalFileName + ' 复制成功'
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
          if (item.transformedName.includes(videoTitle)) {
            highlightBox(ele)
            createOpenLocalFolderBtn(ele)
            showDownloadedVideoTitle(ele, item, count)

            // 递增索引变量
            count++

            // 当前项的originalFileName 是否为 -c 或者 -C 结尾  如果是则说明当前项为中文磁链
            if (
              item.originalFileName.endsWith('-c') ||
              item.originalFileName.endsWith('-C')
            ) {
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
      return $('.video-detail strong').first().text().trim().toLowerCase()
    }

    /**
     * 从 localStorage 获取 nfoFiles
     * @returns {Array} nfoFiles 数组
     */
    function getNfoFiles() {
      const nfoFilesJson = localStorage.getItem('nfoFiles')
      return nfoFilesJson ? JSON.parse(nfoFilesJson) : null
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

      titleElement.textContent = item.originalFileName

      Object.assign(titleElement.style, {
        with: '130px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      })

      downloadedVideoTitleListItem.appendChild(titleElement)

      downloadedVideoTitleListItem.addEventListener('click', function () {
        navigator.clipboard.writeText(item.transformedName)
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
        if (item.transformedName.includes(videoTitle)) {
          highlightVideoPanel()

          addDownLocalVideoTitleList(item, count)
          count++

          // 当前项的originalFileName 是否为 -c 或者 -C 结尾  如果是则说明当前项为中文磁链
          if (
            item.originalFileName.endsWith('-c') ||
            item.originalFileName.endsWith('-C')
          ) {
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
   * Emby重复视频处理函数
   */
  const EmbyDuplicateVideoHandler = (function () {
    /**
     * 从 localStorage 获取 nfoFiles
     * @returns {Array} nfoFiles 数组
     */
    function getNfoFiles() {
      const nfoFilesJson = localStorage.getItem('nfoFiles')
      return nfoFilesJson ? JSON.parse(nfoFilesJson) : null
    }

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
     * 获取具有重复 transformedName 的项并去重
     * @param {Array} items - 要处理的数组
     * @returns {Array} uniqueTransformedNames - 去重后的 transformedName 数组
     */
    function getUniqueTransformedNames(items) {
      const transformedNameMap = {}
      const uniqueTransformedNames = []

      // 遍历每个项，将具有重复 transformedName 的项存储在映射中
      items.forEach((item) => {
        const key = item.transformedName
        if (!transformedNameMap[key]) {
          transformedNameMap[key] = []
        }
        transformedNameMap[key].push(item)
      })

      // 遍历映射，找出具有重复 transformedName 的项并去重
      for (const key in transformedNameMap) {
        if (transformedNameMap[key].length > 1) {
          uniqueTransformedNames.push(key)
        }
      }

      return uniqueTransformedNames
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
        'transformedName'
      )
      console.log(
        '%c Line:848 🍅 所有重复的影片, 共 ' + allDuplicates.length + ' 个',
        'color:#fca650',
        allDuplicates
      )

      /**
       *  Emby去重的影片标题
       */
      const EmbyRemovesDuplicateVideoTitle = getUniqueTransformedNames(nfoFiles)
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
   *  页面加载前执行
   */
  async function onBeforeMount() {
    OriginalStyleHandler()

    // 立即调用以初始化按钮和事件处理程序
    LocalFolderHandler()

    // 调用列表页处理函数
    ListPageHandler()

    // 调用详情页处理函数
    DetailPageHandler()

    EmbyDuplicateVideoHandler()
  }

  onBeforeMount()
})()
