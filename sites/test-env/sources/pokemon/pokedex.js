let url = 'https://pokeapi.co/api/v2/pokemon/';

const response = await fetch(url);
const json = await response.json();
const data = json.results;
export { data };
