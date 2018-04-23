
let winners = [];
let dragons = [];

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
        if (winners.filter(winner => winner.knight == knight).length === 0) {
          console.log('finding winning dragon');
          for (let dragon of dragons) {
            let result = await sendDragon(dragon, game.gameId);
            if (result) {
              console.log('found one');
              winners.push({ knight, dragon });
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

