// get all the canvas parts from the html
const usersContainer = document.getElementById('usersContainer');
const clickingContainer = document.getElementById('clickingContainer');
const backgroundImage = document.getElementById('backgroundImage');
const groundImage = document.getElementById('groundImage');

// Preload the single sprite sheet instead of a separate image per direction/frame
const bodySprite = new Image();

// יצירת קנבס נסתר כדי שנוכל לקרוא את הפיקסלים של הדמויות לטובת לחיצות (Pixel-Perfect)
const spriteCanvas = document.createElement('canvas');
spriteCanvas.width = 2250;
spriteCanvas.height = 900;
const spriteCtx = spriteCanvas.getContext('2d', { willReadFrequently: true });

bodySprite.onload = () => {
  spriteCtx.drawImage(bodySprite, 0, 0);
};
bodySprite.src = '../media/body.png';

// The sprite sheet is a grid of 9 columns x 3 rows, each cell 250x300.
const SPRITE_COLS = 9;
const SPRITE_ROWS = 3;

// Column index (0 = leftmost in the image) for each direction name
const DIRECTION_COLUMNS = {
  BodyForwardLeft: 0,
  BodyLeft: 1,
  BodyBackLeft: 2,
  BodyFullBackLeft: 3,
  BodyFullBackRight: 4,
  BodyBackRight: 5,
  BodyRight: 6,
  BodyForwardRight: 7,
  BodyForward: 8,
};

// פונקציה מעודכנת שמחשבת את המיקום בתמונה לפי מצב ההליכה
function getSpritePosition(direction, walkFrameIndex, isMoving) {
  const col = DIRECTION_COLUMNS[direction] ?? DIRECTION_COLUMNS.BodyForward;
  let row = 0;

  // לוגיקת האנימציה: 0=עמידה, 1=הליכה 1, 2=עמידה, 3=הליכה 2
  if (isMoving) {
    if (walkFrameIndex === 1) {
      row = 1; // הליכה 1 (שורה שנייה)
    } else if (walkFrameIndex === 3) {
      row = 2; // הליכה 2 (שורה שלישית)
    }
    // במצבים 0 ו-2, ה-row נשאר 0 (עמידה)
  }

  const xPercent = (col / (SPRITE_COLS - 1)) * 100;
  const yPercent = (row / (SPRITE_ROWS - 1)) * 100;
  return `${xPercent}% ${yPercent}%`;
}

// פונקציה חדשה: בודקת האם הפיקסל הספציפי שעליו לחצנו בשחקן הוא שקוף
function isCharacterPixelTransparent(user, clickRelativeX, clickRelativeY, elementWidth, elementHeight) {
  const col = DIRECTION_COLUMNS[user.direction] ?? DIRECTION_COLUMNS.BodyForward;
  let row = 0;
  
  const isUserMoving = userMovingStates[user.username] || false;
  if (isUserMoving) {
    if (walkFrame === 1) row = 1;
    else if (walkFrame === 3) row = 2;
  }

  // ממירים את נקודת הלחיצה ממידות המסך היחסיות למידות המקוריות של הפריים בגיליון (250x300)
  const pixelX = (clickRelativeX / elementWidth) * 250;
  const pixelY = (clickRelativeY / elementHeight) * 300;

  // המיקום המוחלט בקנבס הנסתר הענק
  const sheetX = col * 250 + pixelX;
  const sheetY = row * 300 + pixelY;

  // הגנה מחריגה מגבולות התמונה
  if (sheetX < 0 || sheetX >= 2250 || sheetY < 0 || sheetY >= 900) return true;

  // שולפים את הפיקסל הספציפי. ערוץ ה-alpha (האינדקס הרביעי) אומר לנו אם זה שקוף
  const pixelData = spriteCtx.getImageData(Math.floor(sheetX), Math.floor(sheetY), 1, 1).data;
  return pixelData[3] === 0; // אם 0 - שקוף לחלוטין
}

//??
const tempCanvas = document.createElement('canvas');
const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

function getRoomFromPath(url) {
  const parts = url.split('/');
  const fileName = parts[parts.length - 1];
  const room = fileName.split('.')[0];
  return room;
}
const currentRoom = getRoomFromPath(window.location.pathname);

const socket = io({ query: { tabId: currentTabId } });

// Get all the chat part from the html
const sendButton = document.getElementById('send-button');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('msgInput');

let charactersData = [];

// Original canvas dimensions ??
const originalBackgroundWidth = 1920;
const originalBackgroundHeight = 1280;

// Resized canvas dimensions
let currentBackgroundWidth = backgroundImage.width;
let currentBackgroundHeight = backgroundImage.height;

// Resized canvas dimensions
let currentTempCanvasWidth = backgroundImage.width;
let currentTempCanvasHeight = backgroundImage.height;

let newDirection = 'BodyForward';

// Movement & Animation states
let isMoving = false;
let targetMovePosition = null;
let walkFrame = 0;

// Track moving states for ALL users
let previousPositions = {};
let userMovingStates = {};

// *** שינוי מרכזי: משתנים חדשים לניהול זמן האנימציה ***
let lastAnimationTime = 0;
const ANIMATION_INTERVAL = 130; // 130 מילישניות בין כל פריים הליכה

function updateOverlay() {
  const imgRect = backgroundImage.getBoundingClientRect();

  const imgWidth = imgRect.width;
  const imgHeight = imgRect.height;
  const imgLeft = imgRect.left;
  const imgTop = imgRect.top;

  clickingContainer.style.width = (imgWidth) + 'px';
  clickingContainer.style.height = (imgHeight) + 'px';
  clickingContainer.style.left = (imgLeft) + 'px';
  clickingContainer.style.top = (imgTop) + 'px';
  
  usersContainer.style.width = (imgWidth) + 'px';
  usersContainer.style.height = (imgHeight) + 'px';
  usersContainer.style.left = (imgLeft) + 'px';
  usersContainer.style.top = (imgTop) + 'px';
}

window.addEventListener('load', updateOverlay);
window.addEventListener('resize', updateOverlay);

function resizeCanvases() {
  currentBackgroundWidth = backgroundImage.width;
  currentBackgroundHeight = backgroundImage.height;

  drawCharacters();

  tempCanvas.width = backgroundImage.width;
  tempCanvas.height = backgroundImage.height;

  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
  tempCtx.drawImage(groundImage, 0, 0, tempCanvas.width, tempCanvas.height);
}

window.addEventListener('load', function() {
  resizeCanvases();
});

window.addEventListener('resize', resizeCanvases);

window.addEventListener('popstate', console.log('i should seperate the socket varible from here and refrsh the things to work here in popstate'));

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = messageInput.value.trim();
  if (message !== '') {
    socket.emit('chatMessage', message);
    messageInput.value = '';
  }
});

function isPixelTransparent(x, y) {
  const pixelData = tempCtx.getImageData(x, y, 1, 1).data;
  const alpha = pixelData[3]; 
  return alpha === 0; 
}

socket.on('newPositions', (data) => {
  const newCharactersData = data.filter(player => player.room === currentRoom);
  
  newCharactersData.forEach(player => {
    const prevPos = previousPositions[player.username];
    if (prevPos) {
      const dist = Math.hypot(player.x - prevPos.x, player.y - prevPos.y);
      userMovingStates[player.username] = dist > 0.5;
    } else {
      userMovingStates[player.username] = false;
    }
    previousPositions[player.username] = { x: player.x, y: player.y };
  });

  charactersData = newCharactersData;
  
  if (isMoving && targetMovePosition) {
    const currentPlayer = charactersData.find(player => player.username === currentUsername);
    if (currentPlayer) {
      const dist = Math.hypot(currentPlayer.x - targetMovePosition.x, currentPlayer.y - targetMovePosition.y);
      if (dist < 15) { 
        isMoving = false;
        targetMovePosition = null;
      }
    }
  }

  socket.emit('joinRoom', currentRoom);
});

// *** שינוי מרכזי: לולאת האנימציה הראשית (Game Loop) ***
function gameLoop(timestamp) {
  // בודקים אם עבר מספיק זמן מאז הפעם האחרונה ששינינו פריים הליכה (ANIMATION_INTERVAL)
  if (timestamp - lastAnimationTime >= ANIMATION_INTERVAL) {
      walkFrame = (walkFrame + 1) % 4; // מעדכן את הפריים (0, 1, 2, 3)
      lastAnimationTime = timestamp; // מאפס את הטיימר
  }

  // מציירים את כולם מחדש בכל פריים, עם המיקום והפריים המעודכנים ביותר
  drawCharacters();

  // קורא לפונקציה הזו שוב ושוב בסינכרון מושלם עם קצב הריענון של המסך
  requestAnimationFrame(gameLoop);
}

// מתחילים את הלולאה כשמסיימים לטעון את העמוד
requestAnimationFrame(gameLoop);


function drawCharacters() {
  const activeUsernames = new Set();

  for (let i = 0; i < charactersData.length; i++) {
    const user = charactersData[i];
    activeUsernames.add(user.username);
    
    // קפיצה ישירה למיקום האמיתי ללא החלקה כלל
    const xPos = (user.x / originalBackgroundWidth) * currentBackgroundWidth;
    const yPos = (user.y / originalBackgroundHeight) * currentBackgroundHeight;

    // מיחזור אלמנטים (לא יוצרים מחדש אם הם קיימים)
    let userDiv = document.getElementById(user.username);
    
    if (!userDiv) {
      userDiv = document.createElement('div');
      userDiv.classList.add('userCharacter');
      userDiv.id = user.username;
      
      const characterImage = document.createElement('div');
      characterImage.classList.add('characterImage');
      userDiv.appendChild(characterImage);

      const usernameText = document.createElement('span');
      usernameText.classList.add('usernameText');
      usernameText.textContent = user.username;
      userDiv.appendChild(usernameText);
      
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('messageText');
      messageDiv.style.display = 'none'; // מוסתר כברירת מחדל
      userDiv.appendChild(messageDiv);

      usersContainer.appendChild(userDiv);
    }

    const currentDir = (user.username === currentUsername) ? newDirection : user.direction;
    const isUserMoving = userMovingStates[user.username] || false;
    
    const characterImage = userDiv.querySelector('.characterImage');
    characterImage.style.backgroundPosition = getSpritePosition(currentDir, walkFrame, isUserMoving);

    // --- הוספת אפקט ה"קפיצה" (Bounce) בהליכה ---
    let bounceOffset = 0;
    if (isUserMoving) {
        // בפריימים 1 ו-3 (פריימי ההליכה עצמם), הדמות "קופצת" קצת למעלה
        if (walkFrame === 1 || walkFrame === 3) {
            bounceOffset = -0.5; // הוקטן ל -0.5 כדי שיהיה סופר עדין לכולם
        }
    }
    // החלת הטרנספורמציה
    characterImage.style.transform = `translateY(${bounceOffset}px)`;
    // -------------------------------------------

    // עדכון גודל ומיקום: עכשיו מתחשבים בפרופורציות האמיתיות של התמונה (250x300)
    const charSize = currentBackgroundWidth / 8; // רוחב
    userDiv.style.width = charSize + 'px';
    userDiv.style.height = (charSize * 1.2) + 'px'; // הגובה הוא פי 1.2 מהרוחב כדי להכיל את כל הציור
    userDiv.style.zIndex = user.zIndex;

    const usernameText = userDiv.querySelector('.usernameText');
    usernameText.style.fontSize = (currentBackgroundWidth / 70) + 'px';

    const userLeft = xPos - charSize / 2;
    // החישוב המושלם: אם הרגליים בשישית מהתחתית, הן בדיוק במרחק charSize מלמעלה!
    const userTop = yPos - charSize; 

    userDiv.style.left = userLeft + 'px';
    userDiv.style.top = userTop + 'px';

    // עדכון הודעת צ'אט
    const messageDiv = userDiv.querySelector('.messageText');
    if (user.message && user.message !== '') {
      messageDiv.textContent = user.message;
      messageDiv.style.display = 'block';
    } else {
      messageDiv.style.display = 'none';
    }
  }

  // מחיקת שחקנים שהתנתקו (ללא שאריות מנגנון ההחלקה)
  Array.from(usersContainer.children).forEach(child => {
    if (!activeUsernames.has(child.id)) {
      child.remove();
      delete previousPositions[child.id];
      delete userMovingStates[child.id];
    }
  });
}

function findClickedUser(x, y) {
  const rect = groundImage.getBoundingClientRect();

  // אנחנו ממיינים את השחקנים לפי ה-zIndex (מהגבוה לנמוך) כדי שאם הם חופפים, נלחץ על זה שמקדימה
  const sortedUsers = [...charactersData].sort((a, b) => b.zIndex - a.zIndex);

  for (let i = 0; i < sortedUsers.length; i++) {
    const user = sortedUsers[i];
    const userDiv = document.getElementById(user.username);
    if (!userDiv) continue;

    // עכשיו אנחנו בודקים את התיבה של התמונה עצמה בלבד, ולא כולל הטקסט או ההודעות
    const characterImage = userDiv.querySelector('.characterImage');
    if (!characterImage) continue;

    const charRect = characterImage.getBoundingClientRect();
    const charLeft = charRect.left - rect.left;
    const charTop = charRect.top - rect.top;
    const charRight = charLeft + charRect.width;
    const charBottom = charTop + charRect.height;

    // קודם כל בודקים אם הלחיצה היא בכלל בתוך הריבוע החוסם
    if (x >= charLeft && x <= charRight && y >= charTop && y <= charBottom) {
      
      // ואז בודקים ברמת הפיקסל כדי לדעת אם לחצנו על צבע או על רקע שקוף
      const clickRelativeX = x - charLeft;
      const clickRelativeY = y - charTop;

      if (!isCharacterPixelTransparent(user, clickRelativeX, clickRelativeY, charRect.width, charRect.height)) {
        return user; // מחזיר את השחקן רק אם הלחיצה הייתה על חלק מצויר שלו
      }
    }
  }
  return null;
}

clickingContainer.addEventListener('click', (event) => {
  const rect = groundImage.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const clickX = (x / currentBackgroundWidth) * originalBackgroundWidth;
  const clickY = (y / currentBackgroundHeight) * originalBackgroundHeight;

  const clickedUser = findClickedUser(x, y);

  if (clickedUser && clickedUser.username !== currentUsername) {
    console.log(clickedUser.username);
  } else {
    const currentPlayer = charactersData.find(player => player.username === currentUsername);

    if (currentPlayer) {
      // בגלל שמיקום ה-Y שלנו מיושר עכשיו בדיוק לרגליים (5/6 מהתמונה),
      // אין צורך בשום קיזוז! אנחנו רוצים שהרגליים יגיעו בדיוק לאיפה שהעכבר לחץ.
      let initialTargetX = clickX;
      let initialTargetY = clickY; 

      const currentX = currentPlayer.x;
      const currentY = currentPlayer.y;
      
      // 2. מחשבים את הזווית אל נקודת היעד המותאמת
      let angle = Math.atan2(initialTargetY - currentY, initialTargetX - currentX);

      // (קביעת כיוון הדמות נשארת אותו דבר)
      if (angle >= -Math.PI / 8 && angle < Math.PI / 8) {
        newDirection = 'BodyRight';
      } else if (angle >= Math.PI / 8 && angle < 3 * Math.PI / 8) {
        newDirection = 'BodyForwardRight';
      } else if (angle >= 3 * Math.PI / 8 && angle < 5 * Math.PI / 8) {
        newDirection = 'BodyForward';
      } else if (angle >= 5 * Math.PI / 8 && angle < 7 * Math.PI / 8) {
        newDirection = 'BodyForwardLeft';
      } else if (angle >= 7 * Math.PI / 8 || angle < -7 * Math.PI / 8) {
        newDirection = 'BodyLeft';
      } else if (angle >= -7 * Math.PI / 8 && angle < -5 * Math.PI / 8) {
        newDirection = 'BodyBackLeft';
      } else if (angle >= -5 * Math.PI / 8 && angle < -3 * Math.PI / 8) {
        newDirection = 'BodyFullBackLeft'; 
      } else {
        newDirection = 'BodyFullBackRight';
      }

      // 3. Raycasting: הולכים מנקודת ההתחלה לעבר היעד ובודקים מתי פוגעים בקיר
      const totalDistance = Math.hypot(initialTargetX - currentX, initialTargetY - currentY);
      
      let safeX = currentX;
      let safeY = currentY;
      let stepSize = 5; 
      let distanceChecked = 0;

      while (distanceChecked < totalDistance) {
        // מוודא שהצעד האחרון לא יעבור את המרחק המקסימלי
        let currentStep = Math.min(stepSize, totalDistance - distanceChecked);

        let testX = safeX + Math.cos(angle) * currentStep;
        let testY = safeY + Math.sin(angle) * currentStep;

        const canvasTestX = (testX / originalBackgroundWidth) * currentBackgroundWidth;
        const canvasTestY = (testY / originalBackgroundHeight) * currentBackgroundHeight;

        // אם הרגליים נוגעות בפיקסל שקוף - עוצרים!
        if (
            canvasTestX < 0 || canvasTestX > currentBackgroundWidth ||
            canvasTestY < 0 || canvasTestY > currentBackgroundHeight ||
            isPixelTransparent(canvasTestX, canvasTestY)
           ) {
          break; 
        }

        safeX = testX;
        safeY = testY;
        distanceChecked += currentStep;
      }

      // 4. שולחים את המיקום הבטוח 
      socket.emit('clickPosition', { x: safeX, y: safeY });
      socket.emit('playerDirection', newDirection);
      
      isMoving = true;
      targetMovePosition = { x: safeX, y: safeY };
    }

    drawCharacters();
  }
});

document.addEventListener('mousemove', (e) => {
  if (isMoving) return; 

  const { clientX, clientY } = e;

  const currentPlayer = charactersData.find(player => player.username === currentUsername);
  if (!currentPlayer) return;

  const userCharacterDiv = document.getElementById(currentUsername);
  if (!userCharacterDiv) return;

  const { top, left, width, height } = userCharacterDiv.getBoundingClientRect();

  const x = clientX - (left + width / 2);
  const y = clientY - (top + height / 2);

  const angle = Math.atan2(y, x);

  if (angle >= -Math.PI / 8 && angle < Math.PI / 8) {
    newDirection = 'BodyRight';
  } else if (angle >= Math.PI / 8 && angle < 3 * Math.PI / 8) {
    newDirection = 'BodyForwardRight';
  } else if (angle >= 3 * Math.PI / 8 && angle < 5 * Math.PI / 8) {
    newDirection = 'BodyForward';
  } else if (angle >= 5 * Math.PI / 8 && angle < 7 * Math.PI / 8) {
    newDirection = 'BodyForwardLeft';
  } else if (angle >= 7 * Math.PI / 8 || angle < -7 * Math.PI / 8) {
    newDirection = 'BodyLeft';
  } else if (angle >= -7 * Math.PI / 8 && angle < -5 * Math.PI / 8) {
    newDirection = 'BodyBackLeft';
  } else if (angle >= -5 * Math.PI / 8 && angle < -3 * Math.PI / 8) {
    newDirection = 'BodyFullBackLeft'; 
  } else {
    newDirection = 'BodyFullBackRight';
  }

  const characterImage = userCharacterDiv.querySelector('.characterImage');
  if (characterImage) {
    // השארנו את ה-walkFrame על 0 כי במעבר עכבר הדמות לא בתנועה ממשית
    characterImage.style.backgroundPosition = getSpritePosition(newDirection, 0, false);
  }
});

socket.emit('initialize', currentTabId);