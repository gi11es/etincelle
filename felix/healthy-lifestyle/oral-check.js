// Check the ideas and constructions in short, guided answers. This is not an accent score.
export function speechText(value) {
  return value.toLowerCase().normalize('NFC').replace(/[’‘]/g, "'")
    .replace(/\bthey're\b/g, 'they are').replace(/\bthere're\b/g, 'there are')
    .replace(/\bthere's\b/g, 'there is').replace(/\bit's\b/g, 'it is')
    .replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
export function checkOralAnswer(value, kind, scene) {
  const text = speechText(value);
  const family = scene.id === 'o1';
  const foods = family ? [/\b(vegetables?|veggies)\b/, /\bcarrots?\b/, /\bbroccoli\b/, /\brice\b/, /\bfish\b/] : [/\bapples?\b/, /\bbananas?\b/, /\bcheese\b/, /\bbread\b/];
  const foodCount = foods.filter(pattern => pattern.test(text)).length;
  const rules = {
    people: [
      ['Les personnes', family ? /\b(family|parents|children|people|mother|father)\b/.test(text) : /\b(friends|people|children|boys|girls)\b/.test(text), family ? 'Nomme les personnes : a family.' : 'Nomme les personnes : three friends.'],
      ['Le lieu', (family ? /\b(in (a |the |their )?kitchen|at home)\b/ : /\b(in (a |the )?park|at (a |the )?park|outside|outdoors)\b/).test(text), family ? 'Ajoute le lieu : in the kitchen.' : 'Ajoute le lieu : in a park.'],
      ['Une phrase pour décrire', /\b(i (can )?see|we can see|the picture shows|there (is|are)|this is)\b/.test(text), 'Commence par I can see…'],
    ],
    food: [
      ['Au moins trois aliments', foodCount >= 3, family ? 'Nomme au moins trois aliments : carrots, broccoli, rice, fish ou vegetables.' : 'Nomme au moins trois aliments : apples, bananas, cheese, bread.'],
      ['Une boisson', /\bwater\b/.test(text), 'N’oublie pas la boisson : water.'],
      ['There are… pour les aliments', /\bthere are\b/.test(text), 'Pour plusieurs aliments, dis There are…'],
      ['There is… pour la boisson', /\bthere is\b/.test(text), 'Pour la boisson, dis There is water.'],
    ],
    action: [['Une action en cours', /\bthey are (\w+ly )?(eating|sharing|having|cooking|drinking|sitting|talking)\b/.test(text), 'Utilise They are + verbe en -ing : They are eating together.']],
    feelings: [['Une émotion dans une phrase', /\b(they (are|feel|look|seem)|everyone (is|feels|looks)|the (family|friends|people) (is|are|feel|look)) (\w+ly |very |really )?(happy|relaxed|calm|comfortable|cheerful|pleased|hungry|thirsty|excited|tired|sad|angry|nervous|worried|upset)\b/.test(text), 'Dis par exemple I think they feel relaxed. Relaxed est un adjectif ; relax est un verbe.']],
    opinion: [
      ['Une hypothèse ou un avis', /\b(maybe|perhaps|i think)\b/.test(text), 'Commence par Maybe… ou I think…'],
      ['Une idée sur la nourriture', /\b(food|meal|homemade|healthy|fresh|tasty|delicious|colourful|colorful|balanced|good|nice|yummy)\b/.test(text) && /\b(is|are|looks?|seems?|likes?|enjoys?|tastes?)\b/.test(text), 'Donne une idée complète : Maybe the food is homemade.'],
    ],
  };
  const checks = (kind === 'summary' ? Object.values(rules).flat() : rules[kind] || []).map(([label, ok, hint]) => ({ label, ok, hint }));
  return { checks, passed: !!text && checks.length > 0 && checks.every(check => check.ok), empty: !text };
}
