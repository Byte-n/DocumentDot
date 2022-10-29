function refreshCache(canvas, ctxMode, radius, color, data) {
  ctx = canvas.getContext('2d')
  if (data['color_']) {
    ctx.fillStyle = color.fill
    ctx.strokeStyle = color.stroke
    data['color_'] = false
  }
  // ctx.clearRect(0, 0, canvas.width, canvas.height);
  // ctx.beginPath();
  ctx.arc(radius, radius, radius - 0.5, 0, Math.PI * 2);
  // ctx.closePath();
  switch (ctxMode) {
    case 0:
      ctx.fill();
      break;
    case 1:
      ctx.fill();
      ctx.stroke();
      break;
    case 2:
      ctx.stroke();
      break;
  }
}

let dataMap = {};
this.onmessage = function (e) {
  if ('setData' === e.data.t) {
    if (!dataMap[e.data.k]) {
      dataMap[e.data.k] = {color_: true}
    }
    for (let k in e.data.data) {
      if (k === 'color') {
        dataMap[e.data.k]['color_'] = true;
      }
      dataMap[e.data.k][k] = e.data.data[k];
    }
  } else if ('close' === e.data.t) {
    delete dataMap[e.data.k]
  } else {
    let data = dataMap[e.data.k]
    refreshCache(data.canvas, data.ctxMode, data.radius, data.color, data)
  }
}