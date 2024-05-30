import { BMSParser } from "./BMSParser.js";

/**
 * William77
 */

export class BMSLoader {

    static _bms;
    static _remoteUrlBase = ''

    static loadBMS(remoteUrlBase, bmsFileName) {
        return new Promise(resolve => {
            fetch(remoteUrlBase + bmsFileName).then(r => r.text()).then(r => {
                this._remoteUrlBase = remoteUrlBase;
                this._bms = (new BMSParser).parse(r);
                resolve(this._bms);
            });
        });
    }

    static async loadImages(progress) {
        let promise = []
        let bmpSFs = { counter: 0 }
        Object.keys(this._bms.bmp).forEach((key, idx, keys) => {
            promise.push(this.loadImage(bmpSFs, key, keys.length, this._remoteUrlBase, this._bms.bmp[key], progress))
        })
        await Promise.all(promise)
        delete bmpSFs.counter
        return Promise.resolve(bmpSFs)
    }

    static async loadSounds(progress) {
        let promise = []
        let wavASs = { counter: 0 }
        Object.keys(this._bms.wav).forEach((key, idx, keys) => {
            promise.push(this.loadSound(wavASs, key, keys.length, this._remoteUrlBase, this._bms.wav[key], progress))
        })
        await Promise.all(promise)
        delete wavASs.counter
        return Promise.resolve(wavASs)
    }

    static loadImage(obj, key, len, baseUrl, filename, progress) {
        return new Promise(resolve => {
            let img = new Image
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                let canvas = document.createElement('canvas')
                canvas.width = img.naturalWidth
                canvas.height = img.naturalHeight
                let ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0)
                obj[key] = canvas.toDataURL();
                progress && progress('image', ++obj.counter, len, filename);
                resolve(null)
            }
            img.src = baseUrl + filename
        })
    }

    static loadSound(obj, key, len, baseUrl, filename, progress) {
        return new Promise(resolve => {
            let audio = new Audio
            audio.onloadstart = () => {
                obj[key] = audio;
                function loaded() {
                    audio.removeEventListener('canplaythrough', loaded)
                    progress && progress('sound', ++obj.counter, len, filename);
                    resolve(null)
                }
                audio.addEventListener('canplaythrough', loaded, false);
            }
            audio.src = baseUrl + filename
        })
    }
}