import { BMSLoader } from './BMSLoader.js';

/**
 * bms player by William77
 * (本版不含遊玩功能, 僅播放功能)
 */

new class BMSMain {

    // 遊戲音樂包資訊
    bms; // 所有 bms 解碼資訊
    bmpRC; // 圖片資訊
    wavRC; // 聲音資訊
    dataRC; // 播放資訊
    barRC; // 遊戲音符出現資訊
    // 小節資訊
    measureInfo;
    // 動畫視圖
    displaySprite;
    displayTrans;
    // 播放起始時間
    startTime = 0;

    constructor() {
        let p = document.getElementById('play')
        p.onclick = () => {
            p.onclick = null
            p.remove()
            this.onLoad()
        }
    }

    async onLoad() {

        // 所有 bms 音樂包下載處 (bms download place: https://www.bmsworld.nz/)
        // cranKy – J219, (147BPM Genre, Euro Beat ^^ Fan Made)
        // [youtube J219] https://www.youtube.com/watch?v=jp4cjU8NLZQ&width=1280&height=720
        // [download J219] https://mega.co.nz/#!yQoBmYib!X5dXTxxRjJEmz4isPQ402xFAfvWZ3ttXdtR8T1twBpk
        // 請自行用 vscode live server 架 server 放音樂包測試 
        let resourceURL = './cranky%20%5BEURO%20BEAT%5D%20J219/'

        // 產生遊戲歌曲相關資源 (J219.bms -> J219-bms-copy.txt, 因為 gitPage 會擋不明副檔名)
        this.bms = await BMSLoader.loadBMS(resourceURL, 'J219-bms-copy.txt');
        this.bmpRC = await BMSLoader.loadImages((type, cur, total, filename) => {
            console.log(type, cur, '/', total, filename, 'loaded')
        });
        this.wavRC = await BMSLoader.loadSounds((type, cur, total, filename) => {
            console.log(type, cur, '/', total, filename, 'loaded')
        });
        this.dataRC = JSON.parse(JSON.stringify(this.bms.data));
        this.barRC = this.generateBarsWithDuration(this.bms.data, 2000);

        // 動畫視圖
        this.displaySprite = document.getElementById('app')
        this.displaySprite.style.filter = 'contrast(1.2)'
        this.displaySprite.style.backgroundSize = `100% 100%`
        this.displaySprite.style.width = '100vw'
        this.displaySprite.style.height = '100vh'

        // 動畫迴圈
        this.loop = this.loop.bind(this)
        this.startTime = performance.now();
        requestAnimationFrame(this.loop);

        console.log(this.bms)
    }

    loop() {
        const tDiff = performance.now() - this.startTime
        if (this.measureInfo) {
            // 圖像播放
            for (let i = 0, l = this.measureInfo.bmp.id.length; i < l; i++) {
                if (tDiff > this.measureInfo.bmp.timing[i]) {
                    let frame = this.bmpRC[this.measureInfo.bmp.id[i]];
                    this.displaySprite.style.backgroundImage = `url(${frame})`;
                    this.measureInfo.bmp.id.shift();
                    this.measureInfo.bmp.timing.shift();
                    i--;
                    l--;
                } else break;
            }
            // 聲音播放
            for (let i = 0, l = this.measureInfo.wav.id.length; i < l; i++) {
                if (tDiff > this.measureInfo.wav.timing[i]) {
                    let audio = this.wavRC[this.measureInfo.wav.id[i]];
                    audio.play()
                    this.measureInfo.wav.id.shift();
                    this.measureInfo.wav.timing.shift();
                    i--;
                    l--;
                } else break;
            }
            // 音符播放
            for (let j = 0, jl = this.measureInfo.note.key.length; j < jl; j++) {
                let key = this.measureInfo.note.key[j];
                for (let i = 0, l = key.id.length; i < l; i++) {
                    if (tDiff > key.timing[i]) {
                        let audio = this.wavRC[key.id[i]];
                        audio.play();
                        key.id.shift();
                        key.timing.shift();
                        i--;
                        l--;
                    } else break;
                }
            }
            // 確認音符播放完畢 keyslen == 0
            let keyslen = this.measureInfo.note.key.map(info => info.length).reduce((i, s) => i + s);
            // 聲音圖像播完換下一小節
            if (!this.measureInfo.wav.id.length && !this.measureInfo.bmp.id.length && !keyslen) {
                this.dataRC.shift();
                this.measureInfo = null;
            }
        }
        // 取得小節資訊
        if (!this.measureInfo) {
            for (let i = 0, l = this.dataRC.length; i < l; i++) {
                let info = this.dataRC[i]
                if (tDiff > info.timing) {
                    this.measureInfo = info;
                    i--;
                    l--;
                } else break;
            }
        }
        // 音符在指定時間出現
        for (let j = 0, jl = this.barRC.length; j < jl; j++) {
            let bar = this.barRC[j]
            for (let i = 0, l = bar.id.length; i < l; i++) {
                if (tDiff > bar.timing[i]) {
                    let node = document.createElement('div')
                    node.style.background = j == 7 ? 'red' : 'yellow'
                    node.style.borderBottom = '5px solid black'
                    node.style.borderTop = '5px solid white'
                    node.style.position = 'absolute'
                    node.style.width = 'calc(100% / 8)'
                    node.style.height = '10px'
                    node.style.left = `calc(100% / 8 * ${j})`
                    node.style.top = '-10px'
                    node.style.transition = `top 2s linear`
                    this.displaySprite.append(node)
                    setTimeout(() => {
                        node.style.top = window.innerHeight - 20 + 'px'
                        setTimeout(() => {
                            node.remove()
                            let lightBar = document.createElement('div')
                            lightBar.style.opacity = '.5'
                            lightBar.style.background = 'white'
                            lightBar.style.backgroundSize = '100% 100%'
                            lightBar.style.position = 'absolute'
                            lightBar.style.width = 'calc(100% / 8)'
                            lightBar.style.left = `calc(100% / 8 * ${j})`
                            lightBar.style.top = '0px'
                            lightBar.style.height = '100vh'
                            lightBar.style.zIndex = '99'
                            this.displaySprite.append(lightBar)
                            setTimeout(() => { lightBar.remove() }, 80)
                        }, 2000)
                    }, 1);
                    bar.id.shift();
                    bar.timing.shift();
                    i--;
                    l--;
                } else break;
            }
        }
        requestAnimationFrame(this.loop)
    }

    /**
     * 音符出現資源設定 (所有音符提早 duration 時間出現)
     * @param data bms.data
     * @param duration 音符出現時間設定 (毫秒)
     * @returns 
     */
    generateBarsWithDuration(data, duration) {
        const keyArr = data.map(d => d.note.key)
        let timing = {}
        let id = {}
        let result = []
        for (let j = 0, jl = keyArr.length; j < jl; j++) {
            const keys = keyArr[j]
            for (let i = 0, il = keys.length; i < il; i++) {
                timing[i] = timing[i] || []
                timing[i] = [...timing[i], ...keys[i].timing]
                id[i] = id[i] || []
                id[i] = [...id[i], ...keys[i].id]
            }
        }
        Object.keys(timing).forEach(tk => result.push({ id: id[tk], timing: timing[tk].map(t => t - duration) }))
        return result;
    }
}

