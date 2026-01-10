function getScrollHeight(elem){
    const rect = elem.getBoundingClientRect();
    const height = scrollY + rect.top - innerHeight;
    return height;
}

function isSticker(blob, name){
    let isWebp = (blob.type === "image/webp" || /\.(webp|was)$/i.test(name)) ? true : false;
    let isValidName = name.startsWith("STK-");

    return (isWebp && isValidName) ? true : false;
}

function mdyToDmy(mdyDate){
    let dateSplit = mdyDate.split("/");
    let dateFormatted = [];

    dateSplit[2] = "20" + dateSplit[2];
    dateFormatted.push(dateSplit[1]);
    dateFormatted.push(dateSplit[0]);
    dateFormatted.push(dateSplit[2]);

    return dateFormatted.join("/");
}

function getDateObj(date, time, format=1){
    let dateSplit = date.split("/");
    let dateFormatted = [];
    if(format === 2){
        dateSplit[2] = "20" + dateSplit[2];
        dateFormatted.push(dateSplit[2]);
        dateFormatted.push(dateSplit[0]);
        dateFormatted.push(dateSplit[1]);
    } else{
        for(let i = dateSplit.length-1; i >= 0; i--){
            dateFormatted.push(dateSplit[i]);
        }
    }

    let d = new Date(dateFormatted.join("-") + ` ${time}`);

    return d;
}
function genImage(blob, name, isNullSticker){
    let elem = document.createElement("img");
    if(isNullSticker){
        elem.src = "./imgs/sticker-placeholder.png";
        elem.classList.add("sticker");
    } else{
        let img = URL.createObjectURL(blob);
        
        elem.src = (name.startsWith("STK-") && name.endsWith(".was")) ? "./imgs/was-placeholder.png" : img;
        elem.classList.add((isSticker(blob, name)) ? "sticker" : "media-img");
        if(!isSticker(blob, name)) elem.onclick = () => viewMedia(img, "img")
    }

    return elem;
}
function genVideo(blob, name){
    let elem = document.createElement("video");
    let vid = URL.createObjectURL(blob);
    
    elem.src = vid;
    elem.classList.add("media-vid");
    elem.setAttribute("controls", "");

    return elem;
}
function genAudio(blob, name){
    let elem = document.createElement("audio");
    let vid = URL.createObjectURL(blob);
    
    elem.src = vid;
    elem.classList.add("media-aud");
    elem.setAttribute("controls", "");

    return elem;
}
function genDoc(blob, name, isPdf){
    let doc = URL.createObjectURL(blob);

    let mediaDocDiv = document.createElement("div");
    mediaDocDiv.classList.add("media-doc");

    let mediaDocNameP = document.createElement("media-doc-name");
    mediaDocNameP.classList.add("media-doc-name");
    mediaDocNameP.innerText = name;

    let mediaDocFuncsDiv = document.createElement("div");
    mediaDocFuncsDiv.classList.add("media-doc-funcs");

    let docOpenA;
    if(isPdf){
        docOpenA = document.createElement("a");
        docOpenA.classList.add("media-doc-open");
        docOpenA.href = "#"
        docOpenA.innerText = "Open";
        docOpenA.onclick = () => viewMedia(doc, 'pdf');
    }

    let docDownloadA = document.createElement("a");
    docDownloadA.classList.add("media-doc-dl");
    docDownloadA.download = name;
    docDownloadA.href = doc;
    docDownloadA.innerText = "Download";

    mediaDocDiv.appendChild(mediaDocNameP);
    if(docOpenA) mediaDocFuncsDiv.appendChild(docOpenA);
    mediaDocFuncsDiv.appendChild(docDownloadA);
    mediaDocDiv.appendChild(mediaDocFuncsDiv);

    return mediaDocDiv;
}
function genDateMarker(date){
    let dateMarkerDiv = document.createElement("div");
    dateMarkerDiv.classList.add("date-marker");

    let dateMarkerDateP = document.createElement("p");
    dateMarkerDateP.classList.add("date-marker-date");
    dateMarkerDateP.innerText = date;

    dateMarkerDiv.appendChild(dateMarkerDateP);

    return dateMarkerDiv;
}

function typeOf(blob, name){
    let result = null;
    if(blob.type === "text/plain" || /\.txt$/i.test(name)){
        result = "txt";
    } else if(blob.type.startsWith("image/") || /\.(png|jpe?g|bmp|webp|svg|gif|was)$/i.test(name)){
        result = "img";
    } else if(blob.type === "application/pdf" || /\.pdf$/i.test(name)){
        result = "pdf"
    } else if(blob.type === "video/" || /\.(mp4|3gp|mkv|webm|mov)$/i.test(name)){
        result = "video";
    } else if(blob.type === "audio/" || /\.(mp3|m4a|ogg|wav|aac|opus)$/i.test(name)){
        result = "audio";
    }
    return result;
}

function processMsgs(chat){
    let chatSplitbyLB = chat.split(/\n/g);
    if(chatSplitbyLB[chatSplitbyLB.length-1] === "") chatSplitbyLB.pop();

    let msgStartReg1 = /^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2} - /;
    let systemMsgReg1 = /^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2} - ([^:]+$|[^:]{40}.+)/;

    let msgStartReg2 = /^\d{1,2}\/\d{1,2}\/\d{2}, \d{1,2}:\d{2} [AP]M - /;
    let systemMsgReg2 = /^\d{1,2}\/\d{1,2}\/\d{2}, \d{1,2}:\d{2} [AP]M - ([^:]+$|[^:]{40}.+)/;
    let dateReg = /^\d{1,2}\/\d{1,2}\/\d{2}/;

    let msgs = new Map();
    let lastMsgDateObj = null;
    let lastMsgDate, lastMsgIndex;

    let users = [];
    let userSelect = document.getElementById("select-user-input");
    
    for(let i = 0; i < chatSplitbyLB.length; i++){
        let line = chatSplitbyLB[i];
        if(msgStartReg1.test(line)){
            let isSystemMsg = systemMsgReg1.test(line) ? true : false;
            let date = line.slice(0, 10);
            if(!msgs.has(date)) msgs.set(date, []);
            let time = line.slice(12, 17);
            let sender = (!isSystemMsg) ? line.slice(20, line.slice(17).indexOf(":")+17) : null;
            let msg = (!isSystemMsg) ? line.slice(line.slice(17).indexOf(":")+19) : line.slice(20);

            if(sender && !users.includes(sender)){
                users.push(sender);
                userSelect.innerHTML += `<option value="${sender}">${sender}</option>`
            }

            let dateObj = getDateObj(date, time);

            if(lastMsgDateObj === null || (lastMsgDateObj && lastMsgDateObj.getTime() <= dateObj.getTime())){
                msgs.get(date).push({
                    msg: [msg],
                    time: time,
                    date: date,
                    sender: sender,
                    isSystem: isSystemMsg
                });
            }

            lastMsgDateObj = dateObj;
            lastMsgDate = date;
            lastMsgIndex = msgs.get(date).length-1;
        } else if(msgStartReg2.test(line)){
            let isSystemMsg = systemMsgReg2.test(line) ? true : false;
            let date = dateReg.exec(line)[0];
            if(!msgs.has(date)) msgs.set(date, []);

            let time = msgStartReg2.exec(line)[0].slice(date.length+2, -3);

            let dateAndTimeLength = date.length+time.length+5;
            let sender = (!isSystemMsg) ? 
                line.slice(dateAndTimeLength, line.slice(dateAndTimeLength).indexOf(":")+dateAndTimeLength) : null;

            let msg = (!isSystemMsg) ? line.slice(
                dateAndTimeLength + ((sender) ? sender.length : 0) + 2
            ) : line.slice(dateAndTimeLength);

            if(sender && !users.includes(sender)){
                users.push(sender);
                userSelect.innerHTML += `<option value="${sender}">${sender}</option>`
            }

            let dateObj = getDateObj(date, time, 2);

            if(lastMsgDateObj === null || (lastMsgDateObj && lastMsgDateObj.getTime() <= dateObj.getTime())){
                msgs.get(date).push({
                    msg: [msg],
                    time: time,
                    date: date,
                    sender: sender,
                    isSystem: isSystemMsg
                });
            }

            lastMsgDateObj = dateObj;
            lastMsgDate = date;
            lastMsgIndex = msgs.get(date).length-1;
        } else{
            msgs.get(lastMsgDate)[lastMsgIndex].msg.push(line);
        }
    }
    return {msgs, users};
}

function newMsgElem(sender, time, type, msg, sentOrReceived, isSystem = false){
    if(type === "text" && msg.join("") === "") return null;

    let wrap = document.createElement("div");
    wrap.classList.add("msg");
    if(!isSystem) wrap.classList.add((sentOrReceived === 0) ? "sent" : "received");
    else wrap.classList.add("system");

    let senderDiv = document.createElement("div")
    senderDiv.classList.add("msg-sender-div");

    let contentDiv = document.createElement("div")
    contentDiv.classList.add("msg-content");

    let timeDiv = document.createElement("div")
    timeDiv.classList.add("msg-time-div");

    let senderP;
    if(!isSystem){
        senderP = document.createElement("p");
        senderP.classList.add("msg-sender");
        senderP.innerText = sender;
    }

    let msgElem;
    if(type === "text"){
        let msgP = document.createElement("p");
        msgP.classList.add("msg-text");
        msg.forEach((val, i) => {
            if(val !== ""){
                let span = document.createElement("span");
                span.innerText += val;
                msgP.appendChild(span);
            }
            msgP.appendChild(document.createElement("br"));
        })
        msgElem = msgP;
    } else if(type === "media"){
        let file = msg;
        let mediaDiv = document.createElement("div");
        mediaDiv.classList.add("media-div");
        if(file.type === "img"){
            let img = genImage(file.data, file.name);
            mediaDiv.appendChild(img);
        } else if(file.type === "video"){
            let vid = genVideo(file.data, file.name);
            mediaDiv.appendChild(vid);
        } else if(file.type === "audio"){
            let aud = genAudio(file.data, file.name);
            mediaDiv.appendChild(aud);
        } else if(!file.type || file.type === "pdf"){
            let doc = genDoc(file.data, file.name, (file.type === "pdf") ? true : false);
            mediaDiv.appendChild(doc);
        }
        msgElem = mediaDiv;
    } else if(type === "null-sticker"){
        let mediaDiv = document.createElement("div");
        mediaDiv.classList.add("media-div");
        let img = genImage(null, null, true)
        mediaDiv.appendChild(img);
        msgElem = mediaDiv;
    }

    let timeP = document.createElement("p");
    timeP.classList.add("msg-time");
    timeP.innerText = time;

    if(!isSystem) senderDiv.appendChild(senderP);
    contentDiv.appendChild(msgElem);
    timeDiv.appendChild(timeP);

    if(!isSystem) wrap.appendChild(senderDiv);
    wrap.appendChild(contentDiv);
    wrap.appendChild(timeDiv);

    return wrap;
}
function viewMedia(blobURL, type){
    let viewer;
    if(type === "pdf") viewer = document.getElementById("pdf-viewer");
    else if(type === "img") viewer = document.getElementById("img-viewer");

    let wrapper = document.getElementById("popup-wrapper");
    let closeBtn = document.getElementById("popup-close-btn");
    viewer.src = blobURL;

    wrapper.style.display = "grid";
    viewer.style.display = "block";
    closeBtn.style.display = "block"

    wrapper.onclick = () => closeBtn.click();
    closeBtn.onclick = () => {
        viewer.style.animation = "popup-hide .3s";
        viewer.onanimationend = () => {
            viewer.style.display = "none";
            wrapper.style.display = "none"
            viewer.style.animation = "popup-show .3s"
            viewer.onanimationend = null;
        }
    }
}

let input = document.getElementById("upload");
let addBtn = document.getElementById("add-chat-btn");
let addChatInCWin = document.getElementById("chat-window-placeholder-div");
let chatMsgDiv = document.getElementById("chat-msg-div");
let chatWindow = document.getElementById("chat-window");
let chatWindowBackdrop = document.getElementById("chat-window-backdrop");
let reviverSec = document.getElementById("reviver");
let toolbar = document.getElementById("toolbar");


let lastChange = 0; // 0 = hide, 1 = show

setInterval(() => {
    let currScroll = scrollY;
    if(currScroll >= getScrollHeight(addChatInCWin)-20 && lastChange !== 1){
        lastChange = 1;
        toolbar.style.animationName = "toolbar-slide-in";
        toolbar.style.display = "grid";
    } else if(currScroll <= getScrollHeight(chatWindow)+20 && lastChange !== 0){
        lastChange = 0;
        toolbar.style.animationName = "toolbar-slide-out";
        toolbar.onanimationend = () => {
            toolbar.style.display = "none";
            toolbar.style.animationName = "toolbar-slide-in";
            toolbar.onanimationend = null;
        }
    }
}, 0);

chatWindow.onclick = () => {
    chatWindow.classList.add("fs");
    chatWindowBackdrop.classList.add("fs");
}

addBtn.onclick = () => input.click();
addChatInCWin.onclick = () => input.click()
input.onchange = async e => {
    const inputFiles = [...e.target.files];
    
    const processedFiles = new Map();
    let fName;
    
    if(inputFiles[0].name.endsWith(".zip")){
        var zip = new JSZip();
        await zip.loadAsync(inputFiles[0])
        .then(async z => {
            for(let [name, obj] of Object.entries(z.files)){
                if(obj.dir) continue;

                if(name.endsWith(".txt")){
                    const text = await obj.async("string");
                    processedFiles.set(name, {
                        name: name,
                        data: text,
                        type: "txt"
                    });
                    fName = name;
                } else{
                    const blob = await obj.async("blob");
                    processedFiles.set(name, {
                        name: name,
                        data: blob,
                        blobURL: URL.createObjectURL(blob),
                        type: typeOf(blob, name)
                    });
                }
            }
        });
        document.getElementById("chat-msg-div").innerHTML = "";
    }

    let popupWrapper = document.getElementById("popup-wrapper");
    let selectUserPopup = document.getElementById("select-user-popup");
    let selectUserInput = document.getElementById("select-user-input");
    let selectUserSubmit = document.getElementById("select-user-submit");
    let popupCloseBtn = document.getElementById("popup-close-btn");

    selectUserInput.innerHTML = "";

    let {msgs, users} = processMsgs(processedFiles.get(fName).data);

    popupWrapper.style.display = "grid";
    selectUserPopup.style.display = "block";
    popupCloseBtn.style.display = "none";

    selectUserSubmit.onclick = () => {
        addChatInCWin.style.display = "none";
        chatWindow.style.display = "block";
        chatMsgDiv.style.display = "block";

        selectUserPopup.style.animation = "popup-hide .3s";
        selectUserPopup.onanimationend = () => {
            selectUserPopup.style.display = "none";
            popupWrapper.style.display = "none";
            selectUserPopup.style.animation = "popup-show .3s"
            selectUserPopup.onanimationend = null;
        }

        let meUser = (users.includes(selectUserInput.value)) ? selectUserInput.value : users[0];
        let keys = [...msgs.keys()];
    

        for(let i = 0; i < keys.length; i++){
            let iMsgs = msgs.get(keys[i]);
            chatMsgDiv.appendChild(
                genDateMarker(mdyToDmy(keys[i]))
            );
            for(let j = 0; j < iMsgs.length; j++){
                let jMsg = iMsgs[j];
                if(!jMsg.msg[0] === "") continue;

                if(jMsg.isSystem){
                    let msg = newMsgElem(jMsg.sender, jMsg.time, "text", jMsg.msg, null, true);
                    if(msg) chatMsgDiv.appendChild(msg);
                } else if(jMsg.msg[0].endsWith("(file attached)")){
                    let fileName = jMsg.msg[0].slice(0, -16);
                    let file = processedFiles.get(fileName);
                    if(file){
                        let msg = newMsgElem(jMsg.sender, jMsg.time, "media", file, (jMsg.sender === meUser) ? 0 : 1);
                        if(msg) chatMsgDiv.appendChild(msg);
                    } else if(fileName.startsWith("STK-") && fileName.endsWith(".webp")){
                        let msg = newMsgElem(jMsg.sender, jMsg.time, "null-sticker", jMsg.msg, (jMsg.sender === meUser) ? 0 : 1)
                        if(msg) chatMsgDiv.appendChild(msg);
                    }
                } else{
                    let msg = newMsgElem(jMsg.sender, jMsg.time, "text", jMsg.msg, (jMsg.sender === meUser) ? 0 : 1)
                    if(msg) chatMsgDiv.appendChild(msg);
                }
            }
        }
    }
    
}