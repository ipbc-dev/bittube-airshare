var TRACKERS = [
  'udp://tracker.leechers-paradise.org:6969',
  'udp://tracker.coppersurfer.tk:6969',
  'udp://tracker.opentrackr.org:1337',
  'udp://explodie.org:6969',
  'udp://tracker.empire-js.us:1337',
  'wss://tracker.btorrent.xyz',
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.fastcast.nz'
]

// turn magnet into hash
function cleanHash(hash) {
  var r = new RegExp('.*:')
  var r2 = new RegExp('&.*')
  return hash.replace(r, '').replace(r2, '')
}

// Get the hash and start torrent if there is an hash
function getHash() {
  var hash = window.location.hash.substring(1)
  hash = cleanHash(hash)
  if (hash.length > 0) {
    console.log('New Hash: ' + hash)
   $('#divLoader').removeClass('hidden');
    var $instructions = $('.instructions')
    $instructions.text('Fetching metadata')
    download(hash)
  }
}

// Initialise seed torrent
function initHolder() {
  var $holder = $('.holder')
  var $upload = document.getElementById('uploadDiv');
  var $uploadBut = document.getElementById('uploadInput');

  $holder.on('dragover', function (event) {
    event.preventDefault()
    event.stopPropagation()
    this.id = 'hover'
    return false
  })

  $holder.on('dragleave', function (event) {
    event.preventDefault()
    event.stopPropagation()
    this.id = ''
    return false
  })

  $holder.on('drop', function (event) {
    this.id = ''
    event.preventDefault()
    event.stopPropagation()
    var file = event.originalEvent.dataTransfer.files[0]
    //updateFileName(file.name)
    seed(file)
  })

  $upload.addEventListener('click', function () {
    $uploadBut.click();
  });

  $uploadBut.addEventListener('change', function () {
    // updateFileName(this.files[0].name)
    seed(this.files[0])
  })

}

document.querySelector('form').addEventListener('submit', function (e) {
  e.preventDefault() // Prevent page refresh

  cleanBody()

  var torrentId = document.querySelector('form input[name=torrentId]').value
  var n = torrentId.search(".torrent");

  if (n >= 0) {
    console.log('torrent file')
    console.log(n);
  } else {
    console.log('magnet')
    console.log(n);
    torrentId + '&tr=wss%3A%2F%2Ftracker.openwebtorrent.com'
  }



  var client = new WebTorrent()
  var torrent = client.add(torrentId, onTorrentDownload)

  initTorrent(torrent)


})

// Initialise event on torrent
function initTorrent(torrent) {
  var $instructions = $('.instructions');

  torrent.on('metadata', function () {
    console.log('got metadata');
    //updateFileName(torrent.name)
  })

  torrent.on('ready', function () {
    console.log('torrent ready');
    appendHolder(torrent)
  })

  torrent.on('download', function (chunkSize) {
    updateData(torrent.uploaded, torrent.downloaded, torrent.uploadSpeed, torrent.downloadSpeed, torrent.infoHash)
    updatePeer(torrent.numPeers, torrent.infoHash)
    updateProgress(Math.round(torrent.progress * 100), torrent.infoHash)
    $instructions.text('Downloading')
  })

  torrent.on('wire', function (wire) {
    console.log('wire');
    console.log('new peer: ' + wire.remoteAddress + ':' + wire.remotePort)
    updatePeer(torrent.numPeers, torrent.infoHash)
  })

  torrent.on('done', function () {
    console.log('torrent finished downloading', torrent)
    appendButtons(torrent);
  })

  torrent.on('upload', function (data) {
    updateData(torrent.uploaded, torrent.downloaded, torrent.uploadSpeed, torrent.downloadSpeed, torrent.infoHash)
    updatePeer(torrent.numPeers, torrent.infoHash)
    $instructions.text('Uploading')
  })

  torrent.on('noPeers', function () {
    console.log('no peers')
    updateData(torrent.uploaded, torrent.downloaded, torrent.uploadSpeed, torrent.downloadSpeed, torrent.infoHash)
    updatePeer(torrent.numPeers, torrent.infoHash)
    updateProgress(Math.round(torrent.progress * 100), torrent.infoHash)
    $instructions.text('Seeding')
  })
}

// Download a torrent
function download(hash) {
  cleanBody()
  var client = new WebTorrent()

  var torrent = client.add({
    infoHash: hash,
    announce: TRACKERS
  }, onTorrentDownload)

  initTorrent(torrent)

}

// Callback on torrent finish
function onTorrentDownload(torrent) {
  console.log('Downloading ' + torrent.name)
  destroy(torrent)
}

// Clean holder body
function cleanBody() {
  // $('.holder').html('')
}

// Seed a file
function seed(file) {
  console.log(file)
  var client = new WebTorrent()
  var torrent = client.seed(file, {
    announce: TRACKERS
  }, onTorrentSeed)
  initTorrent(torrent)
}

// Callback function when torrent is seeding
function onTorrentSeed(torrent) {
  console.log('Seeding ' + torrent.name)
  console.log('Hash: ' + torrent.infoHash)
  updatePeer(torrent.numPeers)
  console.log('show download link');
  var link = 'https://airshare.bittube.app#' + torrent.infoHash
  //link = link.replace(/\/+/g, '/')
  //prompt('Partager le lien:', link)
  destroy(torrent)
}

// Attempt to shutdown gracefully
function destroy(torrent) {
  window.addEventListener('beforeunload', function (e) {
    torrent.destroy(console.log('torrent destroyed'))
  })
}

// Show the input with the current url
function showInputUrl(url) {
  // document.getElementById("sharelink").href= url; 
  // document.getElementById("sharelink").innerHTML = url;
  // $('.share-link').show()
}

// Show the download button for downloading the file
function showDownloadButton(fileName, url) {
  var $but = $('.download-url')
  $but.text('Download ' + fileName)
  $but.attr('href', url)
  $but.attr('download', fileName)
}

// append a torrent to the holder
function appendHolder(torrent) {
  console.log('timestamp: ', moment().format('LLL'));
  console.log('append to holder:', torrent.hash);

  var timestamp = moment().format('LLL');
  var name = torrent.name;
  var link = 'https://airshare.bittube.app#' + torrent.infoHash;
  var classContainer = 'seed-container-1'
  if ( localStorage.getItem('viewStyle') != null ){
    switch (localStorage.getItem('viewStyle')){
      case 'one':
      classContainer = 'seed-container-1';
      break;
      case 'two':
      classContainer = 'seed-container';
      break;
      case 'three':
      classContainer = 'seed-container-3';
      break;
    }
  }

  $('#timeline-label').show();
  $('#timeline').prepend(`<div id="a${torrent.infoHash}" class="itemContainer ${classContainer}">
  <div class="divButtons">
    <button id="copy-${torrent.infoHash}" class="copyButton"><i class="fa fa-copy"></i> Copy link</button>
    <a class="download-url" href="https://airshare.bittube.app/${torrent.infoHash}" download="${name}">
    <button class="defaultButton">
    <i class="fa fa-download"></i> 
    </button></a> 
    <button id="a${torrent.infoHash}-remove" class="remove-seed-btn defaultButton"><i class="fa fa-trash"></i></button></div>

    <h3 class="torrent-name">${name}</h3>
    <p class="seed-timestamp">${timestamp}</p>
    <div id="${torrent.infoHash}-loader" class="divLoader"><img class="imageLoader" src="src/images/bittube-loader.svg"></div>
  </div>`);

  $('#totalFiles')[0].innerHTML = '(' + $('#timeline').children().length + ')';
  $('#divLoader').addClass('hidden');
  $('#timeline').show();

  if ( $('#uploadCollapsible').hasClass('hidden') ){
    $('#uploadCollapsible').removeClass('hidden');
    $('#uploadSection').addClass('uploadCollapse');
    $('#uploadSection').addClass('collapse');
  }

  if ( $(`#${torrent.infoHash}-loader`).length != 0 ){
    $(`#${torrent.infoHash}-loader`)[0].remove();
  }

  torrent.files.find(function (file) {
    file.appendTo(`#a${torrent.infoHash}`, {
      autoplay: true
    });
    if ( $(`#span-${torrent.infoHash}`).length == 0 ){
      $(`#a${torrent.infoHash}`).append(`<p class="share-link"><a class="blueColor" target="_blank" id="span-${torrent.infoHash}" href="${link}"> ${link} </a></p>`)
    }
    
    return file.name.endsWith('.mp4')
  })

  $('body').on('click', `#a${torrent.infoHash}-remove`, function (e) {
    e.preventDefault();
    torrent.destroy(function () {
      $(`#a${torrent.infoHash}`).remove();
      $('#totalFiles')[0].innerHTML = '(' + $('#timeline').children().length + ')';
      if ($('#timeline').children().length == 0) {
        $('#totalFiles')[0].innerHTML = '';
        $('#timeline-label').hide();
        $('#timeline').hide();
        if( $('#uploadCollapsible').hasClass('collapsed') ){
          $('#uploadCollapsible').removeClass('collapsed')
        }
        $('#uploadCollapsible').addClass('hidden');
        $('#uploadSection').removeClass('uploadCollapse').removeClass('collapse').removeClass('show');
        $('#arrowDown').removeClass('fa-chevron-up').addClass('fa-chevron-down');
        
      } 
    });
  });

  $('body').on('click', `#copy-${torrent.infoHash}`, function (e) {
    copyToClipboard(`span-${torrent.infoHash}`, this)
  });

  torrent.files.forEach(function (file) {
    file.getBlobURL(function (err, url) {
      console.log('GETBLOB')
      if (err) {
        console.log('getblob error', err)
      }
      //showDownloadButton(file.name, url)
      console.log('show download link');
      if (  $(`#statusProgress-${torrent.infoHash}`).length === 0 ){
        $(`#a${torrent.infoHash}`).append(`<div class="wrapperTorrent blueColor">
          <div class="torrent-infos">
              <div class="statusProgress">
                <i class="fa fa-heart"></i>
                  <p id="statusProgress-${torrent.infoHash}"></p>
              </div>
              <div class="peer"><i class="fa fa-users"></i>
                  <p id="peer-${torrent.infoHash}"></p>
              </div>
              <div class="uploaded-data"><i class="fa fa-arrow-up"></i>
                  <p id="uploaded-data-${torrent.infoHash}"></p>
              </div>
              <div class="downloaded-data"><i class="fa fa-arrow-down"></i>
                  <p id="downloaded-data-${torrent.infoHash}"></p>
              </div>
          </div>
      </div>`);
      }
      showInputUrl(link)
      //})
    })

  })


}

function appendFileIcon(extention) {
  if ($('.file-icon').length <= 0) {
    var $icon = $('<i>').addClass('file-icon fa fa-5x')
    switch (extention) {
      case 'zip':
      case 'rar':
      case 'tar':
      case 'gz':
        $icon.addClass('fa-file-archive-o')
        break

      case 'avi':
      case 'mkv':
      case 'mov':
      case 'mp4':
        $icon.addClass('fa-file-video-o')
        break

      default:
        $icon.addClass('fa-file-o')
    }
    $icon.appendTo('.holder')
  }
}

// initialize values for torrent info
function initInfo() {
  updateProgress(0)
  updateData(0, 0, 0, 0)
  updatePeer(0)
}


// copy to clipboard
function copyToClipboard(element, button) {
  /* Get the text field */
  const url = document.getElementById(element).innerHTML;
  const selBox = document.createElement('textarea');
  selBox.style.position = 'fixed';
  selBox.style.left = '0';
  selBox.style.top = '0';
  selBox.style.opacity = '0';
  selBox.value = url;
  document.body.appendChild(selBox);
  selBox.focus();
  selBox.select();
  document.execCommand('copy');
  document.body.removeChild(selBox);
  button.innerHTML = '<i class="fa fa-copy"></i> Copied!';
  setTimeout(function (e) {
    button.innerHTML = '<i class="fa fa-copy"></i> Copy Link';
  }, 500);
}


// append buttons download delete and stats 
const appendButtons = (torrent) => {
  $(`#${torrent.infoHash}-loader`).remove();
  if ($(`#statusProgress-${torrent.infoHash}`).length == 0) {
    $(`#a${torrent.infoHash}`).append(`<div class="wrapperTorrent blueColor">
    <div class="torrent-infos">
        <div class="statusProgress">
          <i class="fa fa-heart"></i>
            <p id="statusProgress-${torrent.infoHash}"></p>
        </div>
        <div class="peer"><i class="fa fa-users"></i>
            <p id="peer-${torrent.infoHash}"></p>
        </div>
        <div class="uploaded-data"><i class="fa fa-arrow-up"></i>
            <p id="uploaded-data-${torrent.infoHash}"></p>
        </div>
        <div class="downloaded-data"><i class="fa fa-arrow-down"></i>
            <p id="downloaded-data-${torrent.infoHash}"></p>
        </div>
    </div>
</div>`);
  }

  updatePeer(torrent.numPeers, torrent.infoHash)
  updateData(torrent.uploaded, torrent.downloaded, torrent.uploadSpeed, torrent.downloadSpeed, torrent.infoHash)

}
// bytes to formated data
function formatData(bytes) {
  var sizes = ['B', 'kB', 'MB', 'GB', 'TB']
  if (bytes === 0) {
    return '0 B'
  }
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10)
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
}

// bits to formated speed
function formatSpeed(bits) {
  var sizes = ['b/s', 'kb/s', 'Mb/s', 'Gb/s', 'Tb/s']
  if (bits === 0) {
    return '0 b/s'
  }
  var i = parseInt(Math.floor(Math.log(bits) / Math.log(1024)), 10)
  return Math.round(bits / Math.pow(1024, i), 2) + ' ' + sizes[i]
}

function updateFileName(name) {
  var $holder = $('.holder')
  $holder.html($('<p>').text(name))
}
// Update progress percentage
function updateProgress(percent, infoHash) {
  var $progress = $(`#statusProgress-${infoHash}`); //$('.torrent-infos .statusProgress p')
  $progress.text(percent + '%')
}

// Update value of peer
function updatePeer(peerNum, infoHash) {
  var $peer = $(`#peer-${infoHash}`); //$('.torrent-infos .peer p')
  $peer.text(peerNum)
}

// update the value of downloaded bytes
function updateData(upBytes, downBytes, upSpeed, downSpeed, infoHash) {
  var $upData = $(`#uploaded-data-${infoHash}`); //$('.torrent-infos .uploaded-data p')
  $upData.text(formatData(upBytes) + ' @' + formatSpeed(upSpeed))
  var $downData = $(`#downloaded-data-${infoHash}`); //$('.torrent-infos .downloaded-data p')
  $downData.text(formatData(downBytes) + ' @' + formatSpeed(downSpeed))
}


function triggerInputClick(event) {
  console.log('Hello click');
  // $('#uploadInput').click()
  event.stopPropagation();
  event.preventDefault();
}


const openTopHeader = () =>{
  localStorage.setItem('showTopHeader', 'true');
  document.getElementById('topInstallExtension').style.opacity = '1';
  document.getElementById('topInstallExtension').style.zIndex = '99';
  document.getElementById('topInstallExtension').style.animation = 'divDown 0.5s linear';
  // document.getElementById('topInstallExtension').style.display = 'block';
  document.getElementById('topInstallExtension').style.backgroundColor = '#00abff';
  document.getElementById('topInstallExtension').style.marginTop = '0px';
  
}

const closeTopHeader= () =>{
  localStorage.setItem('showTopHeader', 'false');
  document.getElementById('topInstallExtension').style.opacity = '0';
  document.getElementById('topInstallExtension').style.zIndex = '-1';
  document.getElementById('topInstallExtension').style.animation = 'divUp 0.5s linear';
  // document.getElementById('topInstallExtension').style.display = 'none';
  document.getElementById('topInstallExtension').style.backgroundColor = 'red';
  document.getElementById('topInstallExtension').style.marginTop = '-30px';
  

}

const checkExtensionsInstalled = () => {
  $('#closeBanner').on('click', function(e) {
    closeTopHeader();
  });

  if (typeof chrome == 'object' && typeof chrome.runtime == 'object' && typeof chrome.runtime.sendMessage == 'function') { // eslint-disable-line no-undef
    chrome.runtime.sendMessage('cnogbbmciffpibmkphohpebghmomaemi', {message: 'checkExtension'}, (response) => { // eslint-disable-line no-undef
      console.log(response)
      if(response && response.message){
        closeTopHeader();
      }else{
        if(localStorage.getItem('showTopHeader') != 'false'){
          openTopHeader();
        }
      }
    });
  }
 
}
const selectViews = (element, view) => {
  $('.imageViews svg').css('fill', '#343434');
  $('.imageViews svg rect').css('fill', '#343434');
  $('#' + element + ' svg').css('fill', '#00abff');
  $('#' + element + ' svg rect').css('fill', '#00abff');

  switch (view){
    case 'one':
    $('.itemContainer').addClass('seed-container-1').removeClass('seed-container').removeClass('seed-container-3')
    localStorage.setItem('viewStyle', view);
    break;
    case 'two':
    $('.itemContainer').addClass('seed-container').removeClass('seed-container-3').removeClass('seed-container-1')
    localStorage.setItem('viewStyle', view);
    break;
    case 'three':
    $('.itemContainer').addClass('seed-container-3').removeClass('seed-container').removeClass('seed-container-1')
    localStorage.setItem('viewStyle', view);
    break;
    
  }
} 
const hookClicks = () => {
  $('#uploadCollapsible').on('click', function(e){
    if ( $('#arrowDown').hasClass('fa-chevron-down') ){
      $('#arrowDown').removeClass('fa-chevron-down').addClass('fa-chevron-up');
    }else{
      $('#arrowDown').removeClass('fa-chevron-up').addClass('fa-chevron-down');
    }
  })
  $('#threeColumns').on('click', function(e){
    selectViews('threeColumns', 'three');
  });

  $('#twoColumns').on('click', function(e){
    selectViews('twoColumns', 'two');
  });

  $('#oneColumn').on('click', function(e){
    selectViews('oneColumn', 'one');
  });

  if ( localStorage.getItem('viewStyle') != null ){
    switch (localStorage.getItem('viewStyle')){
      case 'two':
      $('#twoColumns').click()
      break;
      case 'three':
      $('#threeColumns').click()
      break;
      case 'one':
      $('#oneColumn').click()
      break;
    }
  }
} 

// Get Hash on hashchange
$(window).bind('hashchange', function () {
  getHash()
})

// Get Hash on loading page
$(document).ready(function () {
  checkExtensionsInstalled();
  hookClicks();
  initHolder();
  initInfo();
  getHash();
})