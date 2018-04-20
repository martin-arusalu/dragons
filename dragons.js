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
let results = [];
let curGame = {};

const play = async (count) => {
  if (count <= 10) {
    console.log(count);
    fetch('http://www.dragonsofmugloar.com/api/game')
      .then(response => response.json())
      .then(game => {
        fetch('http://www.dragonsofmugloar.com/weather/api/report/' + game.gameId)
          .then(response => response.text())
          .then(xml => (new window.DOMParser()).parseFromString(xml, "text/xml"))
          .then(async weatherXML => {
            const weather = xmlToJson(weatherXML).report;
            const knight = game.knight;

            let scaleThickness = clawSharpness = wingStrength = fireBreath = 5;
            switch (weather.code) {
              case weatherConditions.NORMAL:
                curGame = { ...game };
                curGame.id = count;
                curGame.weather = weather.code;
                curGame.dragons = [];
                await tryAll(game.gameId);
                scaleThickness = 2;
                clawSharpness = 4;
                wingStrength = 5;
                fireBreath = 9;
                break;
              case weatherConditions.FLOOD:
                scaleThickness = 1;
                clawSharpness = 9;
                wingStrength = 10;
                fireBreath = 0;
                break;
            }

            //sendDragon({ scaleThickness, fireBreath, clawSharpness, wingStrength }, game.gameId);
            play(count+1);
          });
      });
  } else {
    console.log(JSON.stringify(results));
  }
}

play(1);

const sendDragon = async (dragon, gameId) => {
  await fetch('http://www.dragonsofmugloar.com/api/game/' + gameId + '/solution', {
    method: 'PUT',
    body: JSON.stringify({ dragon }),
    headers: new Headers({
      'Content-Type': 'application/json'
    })
  })
    .then(response => response.json())
    .then(result => {
      if (result.status === "Victory") {
        curGame.dragons.push(dragon);
      }
    });
}

const tryAll = async (gameId) => {
  const dragons = generateDragons();
  await dragons.forEach(async dragon => {
    await sendDragon(dragon, gameId);
  });
  results.push(curGame);
}

const generateDragons = () => {
  let dragons = [];

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

  return dragons;
}