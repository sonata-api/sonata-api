import { useStore } from '@savitri/web'

const petStore = useStore('pet')

// petStore.functions.performTrick(5)
petStore.items[0].name

const personStore = useStore('person')
personStore.item.job === 'policeman'

;(async () => {
  const items = await personStore.functions.getAll({
    filters: {
      job: 'baker'
    }
  })

  // items[0].job === 'isso non ecziste'

})()
