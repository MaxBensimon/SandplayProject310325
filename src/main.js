import * as THREE from 'three'; 
import "./style.css"
import gsap from "gsap"
import * as COMPONENTS from "./components.js"

const sizes = COMPONENTS.sizes
const scene = COMPONENTS.scene
const camera = COMPONENTS.camera
const renderer = COMPONENTS.renderer
const controls = COMPONENTS.controls
scene.add(sizes, scene, camera, renderer)

// Scene settings:
scene.background = new THREE.Color("#ffffff")

// Camera settings:
camera.position.x = 10
camera.position.y = 10
camera.position.z = 10

// Controls settings:
controls.enabled = true
controls.enableDamping = false
controls.enablePan = false
controls.enableZoom = true

// Material
const material = new THREE.MeshStandardMaterial({ color: "#ffffff", })

// Light
const light = new THREE.PointLight(0xffffff, 175, 100)
const ambientLight = new THREE.AmbientLight(0x404040, 30)
light.position.set(0, 10, 0)
scene.add(light)
scene.add(ambientLight)





// Static geometry
const waterMat = new THREE.MeshStandardMaterial({color: "#00bfff"})

const bottomCube = new THREE.BoxGeometry(10, .1, 10)

const bottomWaterCube = new THREE.Mesh(bottomCube, waterMat)

bottomWaterCube.position.y = -1.25 // Lige under det nederst lag, hvis der er 12 lag.

scene.add(bottomWaterCube)




let isShiftPressed = false
let isRemoving = false
let isControlPressed = false
let isAdding = false

// Slider value from DOM
const slider = document.getElementById('overlaySphereSize')
const sliderValue = document.getElementById('sliderValue')

// Størrelsen på overlaySphere er altid sliderens value.
var overlaySphereSize = parseFloat(slider.value);

// Raycast
const raycaster = new THREE.Raycaster();

// Plane
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0))
// PlaneHelper
// const planeHelper = new THREE.PlaneHelper(plane, 10, 0xf200ff);
// scene.add(planeHelper);

// Pointer
var pointer = new THREE.Vector2()

// Overlay Sphere
const overlayGeo = new THREE.SphereGeometry(overlaySphereSize, 32, 16)
const overlayMat = new THREE.MeshBasicMaterial(
  {
    color: 0xff0000,
    transparent: true,
    opacity: .25,
    //blending: THREE.AdditiveBlending
  }
)
const overlaySphere = new THREE.Mesh(overlayGeo, overlayMat);
//overlaySphere.position.y = 1


// Grid
var gridSize = 10
var gridDivisions = 100
var layers = 12
const totalCount = gridDivisions * gridDivisions * layers;
const cellsPerLayer = gridDivisions * gridDivisions

// Geting the size of a single cell in the grid
const cellSize = gridSize / gridDivisions

// Making some cubes based on the grid cell size
const cubeGeo = new THREE.BoxGeometry(cellSize, cellSize, cellSize)
const cubeMat = new THREE.MeshStandardMaterial({color: "#ffe6a1", roughness: 1})

// InstancedMesh
const instancedMesh = new THREE.InstancedMesh(cubeGeo, cubeMat, totalCount);
instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

let index = 0;
const matrix = new THREE.Matrix4();

for (let height = 0; height < layers; height++)
{
  for (let i = 0; i < gridDivisions; i++)
  {
    for (let j = 0; j < gridDivisions; j++)
    {
      const x = (i * cellSize) - (gridSize / 2) + (cellSize / 2);
      const z = (j * cellSize) - (gridSize / 2) + (cellSize / 2);
      const y = (cellSize * height) + (cellSize / 2) - (cellSize * layers) // Den sidste del her får cubes til at spawne nedad: '- (cellSize * layers)'.
      
      matrix.makeTranslation(x, y, z);
      instancedMesh.setMatrixAt(index++, matrix);

      //console.log(`${x}, ${y}, ${z}`);
    }
  }
}

instancedMesh.computeBoundingSphere();
scene.add(instancedMesh);

const activeInstances = new Array(totalCount).fill(true) // De cubes der ikke er væk.





// Distance from cube to top stuff
// function getDistanceFromTopCubeToPlane()
// {
//   let topLayer = -1
//   for (let layer = layers - 1; layer >= 0; layer--)
//   {
//     const layerStart = layer * cellsPerLayer
//     if (activeInstances.slice(layerStart, layerStart + cellsPerLayer).some(v => v))
//     {
//       topLayer = layer
//       break;
//     }
//   }
//   if (topLayer === -1)
//     return null

//   const topCubeY = (cellSize * topLayer) + cellSize - (cellSize * layers)
//   return Math.abs(topCubeY)
// }

// let topCubeMarker = null
// function highlightTopCube()
// {
//   if (topCubeMarker)
//     scene.remove(topCubeMarker)

//   const distance = getDistanceFromTopCubeToPlane()
//   if (distance == null)
//     return

//   const markerGeo = new THREE.BoxGeometry(.1, .1, .1)
//   const markerMat = new THREE.MeshBasicMaterial({ color: 0xf200ff })
//   topCubeMarker = new THREE.Mesh(markerGeo, markerMat)

//   topCubeMarker.position.y = distance
//   scene.add(topCubeMarker);
// }

function getTopCubePosition()
{
  let topLayer = -1
  for (let layer = layers - 1; layer >= 0; layer--)
  {
    const layerStart = layer * cellsPerLayer
    if (activeInstances.slice(layerStart, layerStart + cellsPerLayer).some(v => v))
    {
      topLayer = layer
      break
    }
  }
  if (topLayer === -1) return null
  
  return (cellSize * topLayer) + (cellSize / 2) - (cellSize * layers)
}

let topCubeMarker = null
function highlightTopCube()
{
  if (topCubeMarker)
    scene.remove(topCubeMarker)
  
  const topY = getTopCubePosition()
  if (topY === null)
    return
  
  const markerGeo = new THREE.BoxGeometry(.1, .1, .1)
  const markerMat = new THREE.MeshBasicMaterial({ color: 0xf200ff })
  topCubeMarker = new THREE.Mesh(markerGeo, markerMat)
  
  topCubeMarker.position.y = topY
  scene.add(topCubeMarker)
}


// Deep seek copy paste
const columnTopMarkers = [];

function updateColumnTopMarkers() {
  const tops = [];
    
  for (let x = 0; x < gridDivisions; x++) {
      for (let z = 0; z < gridDivisions; z++) {
          // Find top cube in this column
          for (let layer = layers - 1; layer >= 0; layer--) {
              const index = (layer * cellsPerLayer) + (x * gridDivisions) + z;
              if (activeInstances[index]) {
                  const matrix = new THREE.Matrix4();
                  instancedMesh.getMatrixAt(index, matrix);
                  const position = new THREE.Vector3();
                  matrix.decompose(position, new THREE.Quaternion(), new THREE.Vector3());
                  tops.push({
                      x: x,
                      z: z,
                      y: position.y,
                      worldPos: position.clone()
                  });
                  break;
              }
          }
      }
  }
  
  console.log(tops)

  return tops;

    // // Clear previous markers
    // columnTopMarkers.forEach(marker => scene.remove(marker));
    // columnTopMarkers.length = 0;
    
    // // Initialize a grid to track top cubes
    // const columnTops = new Array(gridDivisions * gridDivisions).fill(null);
    
    // // Find top cube for each column
    // for (let layer = layers - 1; layer >= 0; layer--) {
    //     for (let x = 0; x < gridDivisions; x++) {
    //         for (let z = 0; z < gridDivisions; z++) {
    //             const index = (layer * cellsPerLayer) + (x * gridDivisions) + z;
                
    //             if (activeInstances[index] && !columnTops[x * gridDivisions + z]) {
    //                 // Found the top cube for this column
    //                 const matrix = new THREE.Matrix4();
    //                 instancedMesh.getMatrixAt(index, matrix);
    //                 const position = new THREE.Vector3();
    //                 matrix.decompose(position, new THREE.Quaternion(), new THREE.Vector3());
                    
    //                 // Store the position
    //                 columnTops[x * gridDivisions + z] = position.clone();
                    
    //                 // Create a marker
    //                 const markerGeo = new THREE.BoxGeometry(cellSize, cellSize, cellSize);
    //                 const markerMat = new THREE.MeshBasicMaterial({ 
    //                     color: 0xf200ff,
    //                     transparent: true,
    //                     opacity: 0.5
    //                 });
    //                 const marker = new THREE.Mesh(markerGeo, markerMat);
    //                 marker.position.copy(position);
    //                 marker.position.y += cellSize / 2; // Position at top surface
    //                 scene.add(marker);
    //                 columnTopMarkers.push(marker);
    //             }
    //         }
    //     }
    // }
}







for (let i = layers; i > 5; i--) // Fjerner de øverste lag (ved 'layers = 12' vil 'i > 5' fjerne halvdelen)
{
  removeLayer(i)
}

function HideRandomInstance(layer)
{
  const layerStartIndex = layer * cellsPerLayer
  const layerEndIndex = layerStartIndex + cellsPerLayer

  const availableIndices = []

  for (let i = layerStartIndex; i < layerEndIndex; i++)
  {
    if (activeInstances[i])
    {
      availableIndices.push(i)
    }
  }

  if (availableIndices.length === 0)
  {
    console.log(`No active instances left in layer ${layer}`);
    return;
  }

  // Vælg en tilfældig tilgængelig cube 
  const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]

  const matrix = new THREE.Matrix4()

  // Få fat på den oprindelig position af cuben
  instancedMesh.getMatrixAt(randomIndex, matrix)
  const position = new THREE.Vector3()
  matrix.decompose(position, new THREE.Quaternion(), new THREE.Vector3())

  // Gør cuben meget lille
  matrix.makeScale(0, 0, 0).setPosition(position)
  instancedMesh.setMatrixAt(randomIndex, matrix);
  instancedMesh.instanceMatrix.needsUpdate = true;
  activeInstances[randomIndex] = false;
}

// Key down event
document.addEventListener('keydown', (event) =>
  {

  if (event.key === 'Shift')
  {
    isShiftPressed = true
    overlayMat.color = new THREE.Color('#ff0000')
    scene.add(overlaySphere)
  }

  if (event.key === 'Control')
  {
    isControlPressed = true
    overlayMat.color = new THREE.Color('#00ff3c')
    scene.add(overlaySphere)
  }

  if (event.key.toLowerCase() === '1')
  {
    HideRandomInstance(0);
  }
  if (event.key.toLowerCase() === '2')
  {
    HideRandomInstance(1);
  }
  if (event.key.toLowerCase() === '3')
  {
    HideRandomInstance(2);
  }
  if (event.key.toLowerCase() === '4')
  {
    HideRandomInstance(3);
  }
  if (event.key.toLowerCase() === '5')
    {
      HideRandomInstance(4);
    }
})

// Mouse button events
document.addEventListener('mousedown', (event) =>
{
  if (isShiftPressed)
    isRemoving = true
  if (isControlPressed)
    isAdding = true
})
document.addEventListener('mouseup', () => {
  isRemoving = false
  isAdding = false
})

// Key up event
document.addEventListener('keyup', (event) =>
{
  if (event.key === 'Shift')
  {
    isShiftPressed = false
    scene.remove(overlaySphere)
  }
  if (event.key === 'Control')
    {
      isControlPressed = false
      scene.remove(overlaySphere)
    }
})

// Move mouse event
document.addEventListener('mousemove', (event) =>
{
  if (!isShiftPressed && !isControlPressed)
    return

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(pointer, camera);
  const intersection = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, intersection);

  overlaySphere.position.x = intersection.x;
  overlaySphere.position.z = intersection.z;
})

// Håndtering af sliderens værdi:
slider.addEventListener('input', function()
{
  // Først sættes værdien af overlaySphere
  overlaySphereSize = parseFloat(this.value);
  sliderValue.textContent = "Overlay sphere size: " + overlaySphereSize.toFixed(1);

  // Den gamle geo fjernes fra memory
  overlaySphere.geometry.dispose();
  // Ny geo bliver lavet med værdien fra slideren
  overlaySphere.geometry = new THREE.SphereGeometry(overlaySphereSize, 32, 16);
})

function checkSphereCollision(forAdding = false)
{
  // Den her metode skal kunne tjekke om noget er aktive eller ej. Det gør den med true/false:
  // Hvis noget er true, så kan det fjernes og ikke tilføjes
  // Hvis noget er false (se forAdding), så kan det tilføjes og ikke fjernes.
  // Altså: Hvis activeInstances[i] == false, så kan den tilføjes og vice versa.
  // Standarden er true, da det er det som function er refaktoreret af.


  const spherePos = overlaySphere.position
  const sphereRadius = overlaySphere.geometry.parameters.radius
  const collidedIndices = []

  const tempMatrix = new THREE.Matrix4()
  const tempPosition = new THREE.Vector3()

  for (let i = 0; i < totalCount; i++)
  {
    instancedMesh.getMatrixAt(i, tempMatrix)
    tempMatrix.decompose(tempPosition, new THREE.Quaternion(), new THREE.Vector3())

    const distance = tempPosition.distanceTo(spherePos)
    if (distance < sphereRadius)
      collidedIndices.push(i)
  }
  return collidedIndices
}

function removeCubes(collidedIndices)
{
  const matrix = new THREE.Matrix4()
  const position = new THREE.Vector3()

  // For hver ting, der collides med:
  collidedIndices.forEach(index =>
  {
    // Hvis den er active (ikke meget lille):
    if (activeInstances[index])
    {
      // Få fat på den specifikke cube i meshen:
      instancedMesh.getMatrixAt(index, matrix)
      // Bryd den del ned som en Quaternion og en Vector3
      matrix.decompose(position, new THREE.Quaternion(), new THREE.Vector3())

      // Gør den meget lille omkring dens position
      matrix.makeScale(0, 0, 0).setPosition(position)
      instancedMesh.setMatrixAt(index, matrix)

      // Gør cuben inaktiv
      activeInstances[index] = false
    }
  })

  updateColumnTopMarkers()

  // Opdatér instancedMeshen
  instancedMesh.instanceMatrix.needsUpdate = true
}

function removeLayer(layer)
{
  const startIndex = layer * cellsPerLayer
  const endIndex = startIndex + cellsPerLayer

  const matrix = new THREE.Matrix4()
  const position = new THREE.Vector3()
  let isUpdateNeeded = false

  for (let i = startIndex; i < endIndex; i++)
  {
    if (activeInstances[i])
    {
      instancedMesh.getMatrixAt(i, matrix)
      matrix.decompose(position, new THREE.Quaternion(), new THREE.Vector3())

      matrix.makeScale(0, 0, 0,).setPosition(position)
      instancedMesh.setMatrixAt(i, matrix)

      activeInstances[i] = false
      isUpdateNeeded = true
    }
  }
  if (isUpdateNeeded)
  {
    updateColumnTopMarkers()

    instancedMesh.instanceMatrix.needsUpdate = true
  }
}

let canAdd = true
var addDelay = 200
function addCubes(collidedIndices)
{
  if (!canAdd) return

  canAdd = false

  const matrix = new THREE.Matrix4()
  const position = new THREE.Vector3()

  // For hver ting, der collides med:
  collidedIndices.forEach(index =>
  {
    // Hvis den IKKE er active (ikke meget lille):
    if (!activeInstances[index])
    {
      // Få fat på den specifikke cube i meshen:
      instancedMesh.getMatrixAt(index, matrix)
      // Bryd den del ned som en Quaternion og en Vector3
      matrix.decompose(position, new THREE.Quaternion(), new THREE.Vector3())

      // Gør den stor igen omkring dens position
      matrix.makeScale(1, 1, 1).setPosition(position)
      instancedMesh.setMatrixAt(index, matrix)

      // Gør cuben aktiv
      activeInstances[index] = true
    }
  })

  updateColumnTopMarkers()

  // Opdatér instancedMeshen
  instancedMesh.instanceMatrix.needsUpdate = true

  // Timeout på add så det er lidt nemmere at styre
  setTimeout(() => {
    canAdd = true
  }, addDelay)
}













// Gravity
function applyGravity()
{
  const matrix = new THREE.Matrix4()
  const position = new THREE.Vector3()
  let isGravityUpdateNeeded = false

  for (let layer = layers - 1; layer > 0; layer--)
  {
    const layerStart = layer * cellsPerLayer
    const layerBelowStart = (layer - 1) * cellsPerLayer

    for (let i = 0; i < cellsPerLayer; i++)
    {
      const currentIndex = layerStart + i
      const currentBelowIndex = layerBelowStart + i

      // Lav kun operationer hvis det nuværende index har en active cube og det under IKKE har
      if (activeInstances[currentIndex] && !activeInstances[currentBelowIndex])
      {
        instancedMesh.getMatrixAt(currentIndex, matrix)
        matrix.decompose(position, new THREE.Quaternion(), new THREE.Vector3())

        matrix.makeScale(0, 0, 0).setPosition(position)
        instancedMesh.setMatrixAt(currentIndex, matrix)
        activeInstances[currentIndex] = false

        position.y -= cellSize
        const newMatrix = new THREE.Matrix4().makeScale(1, 1, 1).setPosition(position)
        instancedMesh.setMatrixAt(currentBelowIndex, newMatrix)
        activeInstances[currentBelowIndex] = true

        isGravityUpdateNeeded = true
      }
    }
  }
  if (isGravityUpdateNeeded)
  {
    updateColumnTopMarkers()

    instancedMesh.instanceMatrix.needsUpdate = true
    return true
  }
  return false
}

function simulateGravity()
{
  let totalPasses = 0
  const maxPasses = layers * 2

  while (applyGravity() && totalPasses < maxPasses)
    totalPasses
}












// Resizing
window.addEventListener('resize', () =>{
// Updating the sizes
sizes.width = window.innerWidth
sizes.height = window.innerHeight
// Updating the camera as well
camera.aspect = sizes.width / sizes.height
camera.updateProjectionMatrix()
renderer.setSize(sizes.width, sizes.height)
})


// Jeg bør nok flytte kaldet af start
start()
function start()
{
  sliderValue.textContent = "Overlay sphere size: " + overlaySphereSize.toFixed(1);
}


// Defines a loop that works kind of like unity's Update method
const loop = () =>
{
controls.update()

if (isRemoving)
{
  const collidedIndices = checkSphereCollision(false)
  if (collidedIndices.length > 0)
  {
    removeCubes(collidedIndices)
  }
}

if (isAdding)
{
  const collidedIndices = checkSphereCollision(true)
  if (collidedIndices.length > 0)
  {
    addCubes(collidedIndices)
    simulateGravity()
  }
}

renderer.render(scene, camera)
window.requestAnimationFrame(loop)
}

// Calling the loop
loop();