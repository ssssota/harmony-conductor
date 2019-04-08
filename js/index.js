const hc = new HarmonyConductor()

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(() => {
      console.log('ServiceWorker registration successful.')
    }, err => {
      console.log('ServiceWorker registration failed: ', err)
    })
  })
}