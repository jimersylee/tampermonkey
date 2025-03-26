// ==UserScript==
// @name         网页工具箱：快捷键功能集
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  提供多种快捷键功能，目前包括：双击C键复制Markdown链接格式
// @author       Jimmy Lee
// @match        *://*/*
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    /**
     * 配置对象
     */
    const CONFIG = {
        // 双击判定的时间间隔(毫秒)
        doubleClickDelay: 300,

        // 通知配置
        notification: {
            duration: 2000,
            position: 'top',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            textColor: 'white',
            padding: '10px 20px',
            borderRadius: '4px',
            zIndex: 9999
        },

        // 快捷键功能配置
        shortcuts: {
            // 双击C键：复制为Markdown链接
            copyAsMarkdownLink: {
                key: 'c',
                isEnabled: true,
                format: '[{timestamp}-{title}]({url})', // 可自定义格式
                timestampFormat: 'YYYYMMDDHHMI' // 时间戳格式
            }

            // 在此处可以添加更多快捷键功能
            // 例如：
            // copyPlainUrl: {
            //     key: 'u',
            //     isEnabled: true
            // }
        }
    };

    /**
     * 工具类
     */
    const Utils = {
        /**
         * 生成时间戳
         * @param {string} format - 时间戳格式
         * @returns {string} 格式化的时间戳
         */
        generateTimestamp(format) {
            const now = new Date();
            const year = now.getFullYear().toString();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            const hour = now.getHours().toString().padStart(2, '0');
            const minute = now.getMinutes().toString().padStart(2, '0');
            const second = now.getSeconds().toString().padStart(2, '0');

            switch(format) {
                case 'YYMMDDHHMI':
                    return year.substr(2) + month + day + hour + minute;
                case 'YYYYMMDD':
                    return year + month + day;
                case 'YYYYMMDDHHMI':
                    return year + month + day + hour + minute;
                case 'YYYYMMDDHHMMSS':
                    return year + month + day + hour + minute + second;
                default:
                    return year.substr(2) + month + day + hour + minute;
            }
        },

        /**
         * 显示通知
         * @param {string} message - 要显示的消息
         */
        showNotification(message) {
            const notificationConfig = CONFIG.notification;
            const notification = document.createElement('div');

            notification.textContent = message;
            notification.style.position = 'fixed';

            // 根据位置设置样式
            if (notificationConfig.position === 'top') {
                notification.style.top = '20px';
                notification.style.left = '50%';
                notification.style.transform = 'translateX(-50%)';
            } else if (notificationConfig.position === 'bottom') {
                notification.style.bottom = '20px';
                notification.style.left = '50%';
                notification.style.transform = 'translateX(-50%)';
            }

            notification.style.padding = notificationConfig.padding;
            notification.style.backgroundColor = notificationConfig.backgroundColor;
            notification.style.color = notificationConfig.textColor;
            notification.style.borderRadius = notificationConfig.borderRadius;
            notification.style.zIndex = notificationConfig.zIndex;

            document.body.appendChild(notification);

            // 指定时间后移除通知
            setTimeout(() => {
                document.body.removeChild(notification);
            }, notificationConfig.duration);
        }
    };

    /**
     * 功能模块类
     */
    const Features = {
        /**
         * 复制为Markdown链接格式
         */
        copyAsMarkdownLink() {
            const config = CONFIG.shortcuts.copyAsMarkdownLink;
            const timestamp = Utils.generateTimestamp(config.timestampFormat);
            const pageTitle = document.title;
            const url = window.location.href;

            // 应用配置的格式替换占位符
            let markdownLink = config.format
                .replace('{timestamp}', timestamp)
                .replace('{title}', pageTitle)
                .replace('{url}', url);

            // 复制到剪贴板
            GM_setClipboard(markdownLink, 'text');

            // 显示通知
            Utils.showNotification('已复制Markdown链接到剪贴板');
        }

        // 在此处可以添加更多功能
        // 例如：
        // copyPlainUrl() {
        //     GM_setClipboard(window.location.href, 'text');
        //     Utils.showNotification('已复制URL到剪贴板');
        // }
    };

    /**
     * 键盘事件管理器
     */
    const KeyManager = {
        // 存储最后按键的时间
        lastKeyPressTimes: {},

        /**
         * 初始化键盘事件监听
         */
        init() {
            document.addEventListener('keydown', this.handleKeydown.bind(this));
        },

        /**
         * 处理键盘按下事件
         * @param {KeyboardEvent} event - 键盘事件对象
         */
        handleKeydown(event) {
            // 如果在输入框中按键，不触发功能
            if (this.isTypingInInput(event.target)) {
                return;
            }

            // 遍历所有快捷键配置
            Object.entries(CONFIG.shortcuts).forEach(([featureName, shortcutConfig]) => {
                if (shortcutConfig.isEnabled &&
                    (event.key.toLowerCase() === shortcutConfig.key.toLowerCase())) {

                    const currentTime = new Date().getTime();
                    const lastTime = this.lastKeyPressTimes[shortcutConfig.key] || 0;

                    // 检测双击
                    if (currentTime - lastTime < CONFIG.doubleClickDelay) {
                        // 如果Feature中存在对应函数，则执行
                        if (typeof Features[featureName] === 'function') {
                            Features[featureName]();
                            event.preventDefault();
                            event.stopPropagation();
                        }
                    }

                    this.lastKeyPressTimes[shortcutConfig.key] = currentTime;
                }
            });
        },

        /**
         * 检查是否在输入框中
         * @param {Element} target - 事件目标元素
         * @returns {boolean} 是否在输入框中
         */
        isTypingInInput(target) {
            const tagName = target.tagName.toLowerCase();
            const inputTypes = ['text', 'password', 'email', 'number', 'search', 'tel', 'url'];

            return (
                tagName === 'input' && inputTypes.includes(target.type) ||
                tagName === 'textarea' ||
                target.contentEditable === 'true'
            );
        }
    };

    // 初始化
    KeyManager.init();

})();