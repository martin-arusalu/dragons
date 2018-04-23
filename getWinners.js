
let winners = [];
let dragons = [];
const jsonElem = document.getElementById('json');

// REFERENCE: https://hackernoon.com/copying-text-to-clipboard-with-javascript-df4d4988697f
const copyToClipboard = () => {
  const el = document.createElement('textarea');  // Create a <textarea> element
  el.value = JSON.stringify(winners);                                 // Set its value to the string that you want copied
  el.setAttribute('readonly', '');                // Make it readonly to be tamper-proof
  el.style.position = 'absolute';                 
  el.style.left = '-9999px';                      // Move outside the screen to make it invisible
  document.body.appendChild(el);                  // Append the <textarea> element to the HTML document
  const selected =            
    document.getSelection().rangeCount > 0        // Check if there is any content selected previously
      ? document.getSelection().getRangeAt(0)     // Store selection if found
      : false;                                    // Mark as false to know no selection existed before
  el.select();                                    // Select the <textarea> content
  document.execCommand('copy');                   // Copy - only works as a result of a user action (e.g. click events)
  document.body.removeChild(el);                  // Remove the <textarea> element
  if (selected) {                                 // If a selection existed before copying
    document.getSelection().removeAllRanges();    // Unselect everything on the HTML document
    document.getSelection().addRange(selected);   // Restore the original selection
  }
};

const fetchOldWinners = async () => {
  await fetch('https://raw.githubusercontent.com/martin-arusalu/dragons/master/winners.json')
    .then(response => response.json())
    .then(response => {
      winners = response;
    })
}

const sendDragon = async (dragon, gameId) => {
  let finalResult;
  await fetch('http://www.dragonsofmugloar.com/api/game/' + gameId + '/solution', {
    method: 'PUT',
    body: JSON.stringify({ dragon }),
    headers: new Headers({
      'Content-Type': 'application/json'
    })
  })
    .then(response => response.json())
    .then(result => {
      finalResult = result.status === "Victory";
    });
  return finalResult;
}

const generateWinners = async num => {
  console.log('generating winners');
  while (winners.length < num) {
    await fetch('http://www.dragonsofmugloar.com/api/game')
      .then(response => response.json())
      .then(async game => {
        let knight = {
          attack: game.knight.attack,
          armor: game.knight.armor,
          agility: game.knight.agility,
          endurance: game.knight.endurance
        };
        console.log(knight);
        let exist = false;
        for (let winner of winners) {
          if (winner.knight.attack === knight.attack &&
            winner.knight.armor === knight.armor &&
            winner.knight.agility === knight.agility &&
            winner.knight.endurance === knight.endurance) {
            console.log('found duplicate');
            let result = await sendDragon(winner.dragon, game.gameId);
            if (result) {
              exist = true;
              console.log('still winning!');
            } else {
              winners.splice(winners.indexOf(winner), 1);
            }
            break;
          }
        };
        if (!exist) {
          console.log('finding winning dragon');
          for (let dragon of dragons) {
            let result = await sendDragon(dragon, game.gameId);
            if (result) {
              console.log('found one');
              winners.push({ knight, dragon });
              jsonElem.innerHTML = winners.length;
              console.log(winners);
              break;
            }
          }
        }
      }
    );
  }
}

const generateDragons = () => {
  console.log('generating dragons');
  for (let scaleThickness = 0; scaleThickness <= 10; scaleThickness++) {
    for (let fireBreath = 0; fireBreath <= 10; fireBreath++) {
      for (let clawSharpness = 0; clawSharpness <= 10; clawSharpness++) {
        for (let wingStrength = 0; wingStrength <= 10; wingStrength++) {
          if ((scaleThickness + fireBreath + clawSharpness + wingStrength) < 20) continue;
          if ((scaleThickness + fireBreath + clawSharpness + wingStrength) > 20) break;
          dragons.push({
            scaleThickness,
            fireBreath,
            clawSharpness,
            wingStrength
          });
        }
      }
    }
  }
}

const init = async () => {
  await fetchOldWinners();
  await generateDragons();
  await generateWinners(890);
  console.log('done');
}

init();

