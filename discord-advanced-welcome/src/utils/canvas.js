let canvasAvailable = null;
let canvasModule = null;

async function checkCanvas() {
  if (canvasAvailable === null) {
    try {
      canvasModule = await import('@napi-rs/canvas');
      canvasAvailable = true;
      console.log('@napi-rs/canvas module loaded');
    } catch (error) {
      try {
        canvasModule = await import('canvas');
        canvasAvailable = true;
        console.log('canvas module loaded');
      } catch (error2) {
        console.warn('Canvas module could not be loaded. Welcome images disabled.');
        console.warn('To use canvas features, install Visual Studio Build Tools.');
        console.warn('Details: https://github.com/nodejs/node-gyp#on-windows');
        canvasAvailable = false;
      }
    }
  }
  return canvasAvailable;
}

export async function createWelcomeImage({ username, avatarURL, guildName, memberCount }) {
  const isAvailable = await checkCanvas();
  
  if (!isAvailable || !canvasModule) {
    return null;
  }

  const createCanvas = canvasModule.createCanvas;
  const loadImage = canvasModule.loadImage;
  
  const WIDTH = 1200;
  const HEIGHT = 400;
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, '#0d1117');
  gradient.addColorStop(0.5, '#161b22');
  gradient.addColorStop(1, '#1f6feb');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = '#58a6ff';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT / 2);
  ctx.lineTo(WIDTH, HEIGHT / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  try {
    const avatar = await loadImage(avatarURL);
    const avatarSize = 150;
    const avatarX = 100;
    const avatarY = HEIGHT / 2 - avatarSize / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.stroke();
  } catch (error) {
    console.error('Error loading avatar:', error);
  }

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  ctx.font = 'bold 36px Arial';
  ctx.fillStyle = '#58a6ff';
  ctx.fillText('Welcome to the server!', 300, 100);

  ctx.font = 'bold 48px Arial';
  ctx.fillStyle = '#ffffff';
  const maxUsernameWidth = WIDTH - 350;
  let displayUsername = username;
  let usernameWidth = ctx.measureText(displayUsername).width;
  
  if (usernameWidth > maxUsernameWidth) {
    while (usernameWidth > maxUsernameWidth && displayUsername.length > 0) {
      displayUsername = displayUsername.slice(0, -1);
      usernameWidth = ctx.measureText(displayUsername + '...').width;
    }
    displayUsername += '...';
  }
  ctx.fillText(displayUsername, 300, 160);

  ctx.font = '32px Arial';
  ctx.fillStyle = '#8b949e';
  ctx.fillText(`${guildName}`, 300, 230);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  ctx.font = '24px Arial';
  ctx.fillStyle = '#58a6ff';
  ctx.fillText(dateStr, 300, 280);

  ctx.fillStyle = '#1f6feb';
  ctx.fillRect(WIDTH - 250, 50, 200, 60);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Member #' + memberCount, WIDTH - 150, 75);
  ctx.font = '16px Arial';
  ctx.fillText('Total Members', WIDTH - 150, 100);

  return canvas.toBuffer('image/png');
}

