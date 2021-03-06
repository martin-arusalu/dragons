// REFERENCE: https://gist.github.com/chinchang/8106a82c56ad007e27b1
// Changes XML to JSON
// Modified version from here: http://davidwalsh.name/convert-xml-json
function xmlToJson(xml) {

	// Create the return object
	var obj = {};

	if (xml.nodeType == 1) { // element
		// do attributes
		if (xml.attributes.length > 0) {
		obj["@attributes"] = {};
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
			}
		}
	} else if (xml.nodeType == 3) { // text
		obj = xml.nodeValue;
	}

	// do children
	// If just one text node inside
	if (xml.hasChildNodes() && xml.childNodes.length === 1 && xml.childNodes[0].nodeType === 3) {
		obj = xml.childNodes[0].nodeValue;
	}
	else if (xml.hasChildNodes()) {
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
			var nodeName = item.nodeName;
			if (typeof(obj[nodeName]) == "undefined") {
				obj[nodeName] = xmlToJson(item);
			} else {
				if (typeof(obj[nodeName].push) == "undefined") {
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				obj[nodeName].push(xmlToJson(item));
			}
		}
	}
	return obj;
}

const weatherConditions = {
  NORMAL: 'NMR',
  FOG: 'FUNDEFINEDG',
  DRY: 'T E',
  STORM: 'SRO',
  FLOOD: 'HVA'
}
let defeats = 0;
let wins = 0;
let fetchedWinners = [];

const fetchWinners = async () => {
  await fetch('https://raw.githubusercontent.com/martin-arusalu/dragons/master/winners.json')
    .then(response => response.json())
    .then(response => {
      fetchedWinners = response;
    })
}

const play = async (count, games) => {
  if (count <= games) {
    fetch('http://www.dragonsofmugloar.com/api/game')
      .then(response => response.json())
      .then(game => {
        fetch('http://www.dragonsofmugloar.com/weather/api/report/' + game.gameId)
          .then(response => response.text())
          .then(xml => (new window.DOMParser()).parseFromString(xml, "text/xml"))
          .then(async weatherXML => {
            const weather = xmlToJson(weatherXML).report;
            const knight = {
              name: game.knight.name,
              attack: game.knight.attack,
              armor: game.knight.armor,
              agility: game.knight.agility,
              endurance: game.knight.endurance
            };

            let scaleThickness = clawSharpness = wingStrength = fireBreath = 5;
            switch (weather.code) {
              case weatherConditions.NORMAL:
                let absoluteWinner = false;
                for (winner of fetchedWinners) {
                  if (winner.knight.attack === knight.attack &&
                    winner.knight.armor === knight.armor &&
                    winner.knight.agility === knight.agility &&
                    winner.knight.endurance === knight.endurance &&
                    winner.knight.name === knight.name
                  ) {
                    absoluteWinner = winner;
                    break;
                  }
                }
                if (!absoluteWinner) {
                  for (winner of fetchedWinners) {
                    if (winner.knight.attack === knight.attack &&
                      winner.knight.armor === knight.armor &&
                      winner.knight.agility === knight.agility &&
                      winner.knight.endurance === knight.endurance
                    ) {
                      absoluteWinner = winner;
                      break;
                    }
                  }
                }
                if (absoluteWinner) {
                  scaleThickness = winner.dragon.scaleThickness;
                  clawSharpness = winner.dragon.clawSharpness;
                  wingStrength = winner.dragon.wingStrength;
                  fireBreath = winner.dragon.fireBreath;
                }
                break;
              case weatherConditions.FLOOD:
                scaleThickness = 1;
                clawSharpness = 9;
                wingStrength = 10;
                fireBreath = 0;
                break;
            }

            await sendDragon({ scaleThickness, fireBreath, clawSharpness, wingStrength }, game.gameId, knight);
            play(count+1, games);
          });
      });
  } else {
    let container = document.getElementById('games');
    container.appendChild(document.createElement('h1')).innerHTML = 'Wins: ' + wins;
    container.appendChild(document.createElement('h1')).innerHTML = 'Defeats: ' + defeats;
    window.scrollTo({
      top: document.documentElement.offsetHeight,
      behavior: "smooth"
    });
  }
}

const sendDragon = async (dragon, gameId, knight) => {
  await fetch('http://www.dragonsofmugloar.com/api/game/' + gameId + '/solution', {
    method: 'PUT',
    body: JSON.stringify({ dragon }),
    headers: new Headers({
      'Content-Type': 'application/json'
    })
  })
    .then(response => response.json())
    .then(result => {
      if (result.status === "Victory") wins++;
      else {
        defeats++;
      }
      createLog(gameId, dragon, knight, result);
    });
}

const createLog = (gameId, dragon, knight, result) => {
  let container = document.getElementById('games');
  let game = document.createElement('div');
  game.className = 'game';
  game.appendChild(document.createElement('h1')).innerHTML = 'GAME: ' + gameId;
  game.appendChild(document.createElement('p')).innerHTML = 'DRAGON: ' + JSON.stringify(dragon);
  game.appendChild(document.createElement('p')).innerHTML = 'KNIGHT: ' + JSON.stringify(knight);
  let resultElem = document.createElement('div');
  if (result.status === 'Victory') {
    resultElem.className = 'victory';
  } else {
    resultElem.className = 'defeat';
  }
  resultElem.appendChild(document.createElement('h2')).innerHTML = result.status;
  resultElem.appendChild(document.createElement('h3')).innerHTML = result.message;
  game.appendChild(resultElem);
  container.appendChild(game);
  window.scrollTo({
    top: document.documentElement.offsetHeight,
    behavior: "smooth"
  });
}

const init = async () => {
  await fetchWinners();
  play(1, 100);
}

init();