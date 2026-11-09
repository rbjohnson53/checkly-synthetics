import { test, expect } from "@playwright/test"

const baseUrl = "https://pokeapi.co/api/v2/"

test("get favorite pokemon and verify type", async ({ request }) => {
  let favoritePokemon;
  let pokemonFormURL;

  await test.step("get favorite pokemon", async () => {

    const response = await request.get(`${baseUrl}pokemon?limit=50&offset=0`)
    expect(response).toBeOK()

    const data = await response.json()
    favoritePokemon = data.results.find(pokemon => pokemon.name === "pikachu");
  })

  await test.step("get pokemon form", async () => {
    const response = await request.get(`${favoritePokemon.url}`)
    expect(response).toBeOK()

    const pokemonForm = await response.json()
    pokemonFormURL = pokemonForm.forms.url
  })

  await test.step("verify pokemon type", async () => {
    const response = await request.get(`${pokemonFormURL}`)
    expect(response).toBeOK()

    const pokemonForm = await response.json()
    const pokemonType = pokemonForm.types[0].type
    expect(pokemonType).toBe('electric')
  })
})
