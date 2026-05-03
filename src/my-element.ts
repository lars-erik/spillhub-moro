import { LitElement, css, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'

@customElement('my-element')
export class MyElement extends LitElement {
  static styles = css`
    :host { display: block; width: 100vw; height: 100vh; }
    canvas { display: block; width: 100% !important; height: 100% !important; }
  `

  render() {
    return html`<canvas></canvas>`
  }

  async firstUpdated() {
    const canvas = this.shadowRoot!.querySelector('canvas')!
    const w = window.innerWidth, h = window.innerHeight

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(devicePixelRatio)
    renderer.setSize(w, h)
    renderer.toneMapping = THREE.ACESFilmicToneMapping

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    pmrem.compileEquirectangularShader()
    new EXRLoader().load('/little_paris_eiffel_tower_1k.exr', (texture) => {
      const envMap = pmrem.fromEquirectangular(texture).texture
      scene.environment = envMap
      scene.background = new THREE.Color(0x222222)
      texture.dispose()
      pmrem.dispose()
    })

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 100)
    camera.position.set(0, 0, 2)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    await MeshoptDecoder.ready
    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
    loader.load('/olav.glb', (gltf) => {
      gltf.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh)
          (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({ metalness: 1, roughness: 0, side: THREE.DoubleSide })
      })
      scene.add(gltf.scene)
    }, undefined, (err) => console.error('GLTF load error:', err))

    renderer.setAnimationLoop(() => {
      controls.update()
      renderer.render(scene, camera)
    })

    window.addEventListener('resize', () => {
      const w = window.innerWidth, h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    })
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement
  }
}
