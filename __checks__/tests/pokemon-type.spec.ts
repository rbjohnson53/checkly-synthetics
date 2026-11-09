import { test, expect } from '@playwright/test'

const baseUrl = 'https://pokeapi.co/api/v2/'

test('PokeAPI: Pikachu is an electric type', async ({ request }) => {
  let pokemonUrl: string
  let formUrl: string

  await test.step('find Pikachu in the first 50 Pokémon', async () => {
    const response = await request.get(`${baseUrl}pokemon?limit=50&offset=0`)
    await expect(response).toBeOK()

    const data = await response.json()
    const pikachu = data.results.find((pokemon: { name: string }) => pokemon.name === 'pikachu')
    expect(pikachu, 'Pikachu should be in the first 50 results').toBeDefined()
    pokemonUrl = pikachu.url
  })

  await test.step('get Pikachu and its form URL', async () => {
    const response = await request.get(pokemonUrl)
    await expect(response).toBeOK()

    const pokemon = await response.json()
    // `forms` is a list of { name, url } objects, so take the first entry.
    formUrl = pokemon.forms[0].url
  })

  await test.step('verify the form is electric type', async () => {
    const response = await request.get(formUrl)
    await expect(response).toBeOK()

    const form = await response.json()
    expect(form.types[0].type.name).toBe('electric')
  })
})
