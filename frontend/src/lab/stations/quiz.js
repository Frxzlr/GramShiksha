import * as THREE from 'three'
import { makeLabel } from '../labels.js'

const QUESTIONS = [
  {
    q: '1. In a vacuum (no air resistance), which object hits the ground first?',
    options: [
      'A: The heavy metal ball',
      'B: The light rubber ball',
      'C: Both hit the ground at the exact same time',
    ],
    answer: 2,
    explain: 'Without air resistance, gravity accelerates all masses at 9.8 m/s² identically.',
  },
  {
    q: '2. What happens to the block on an incline when slope angle is increased?',
    options: [
      'A: Gravity component along ramp overcomes static friction',
      'B: Gravity completely disappears',
      'C: Static friction becomes infinite',
    ],
    answer: 0,
    explain: 'As inclination increases, component mg*sin(θ) exceeds max static friction μ*N.',
  },
  {
    q: '3. Why does a light sphere land later than a heavy one in atmospheric air?',
    options: [
      'A: Earth gravity pulls less on light mass',
      'B: Air drag creates much higher deceleration on smaller mass',
      'C: Light objects have negative inertia',
    ],
    answer: 1,
    explain: 'Drag deceleration a_drag = F_drag / mass. Smaller mass experiences greater deceleration.',
  },
  {
    q: '4. With friction μ = 0.40, why does the block NOT slide at 15°?',
    options: [
      'A: Incline has zero gravitational component',
      'B: tan(15°) = 0.27 < 0.40, so static friction holds it',
      'C: Incline angle must be exactly 0° for friction',
    ],
    answer: 1,
    explain: 'Sliding occurs only when tan(θ) > μ. At 15°, tan(15°) ≈ 0.27 < 0.40.',
  },
  {
    q: '5. What is the standard acceleration due to gravity (g) near Earth surface?',
    options: [
      'A: Approximately 9.8 m/s²',
      'B: Approximately 3.14 m/s²',
      'C: Approximately 25.0 m/s²',
    ],
    answer: 0,
    explain: 'Earth standard gravitational acceleration is g ≈ 9.8 m/s².',
  },
]

/**
 * Wall Assessment Station
 * Interactive 3D quiz board mounted high on the front wall above all table stations.
 */
export function createQuizStation({ scene, materials, interaction, stateManager }) {
  const group = new THREE.Group()
  group.name = 'QuizStation'
  // Mounted high on the front wall (z = -3.97) well above table (y = 0.9) and station apparatus
  group.position.set(0, 2.38, -3.97)
  group.rotation.x = 0.06 // Slight downward tilt toward camera eye height (1.6m)

  let currentIndex = 0
  let score = 0
  let isWaitingNext = false
  let isFinished = false

  // 1. Board Backing & Frame
  const boardGeo = new THREE.BoxGeometry(3.2, 1.08, 0.04)
  const boardMesh = new THREE.Mesh(boardGeo, materials.quizBoard)
  boardMesh.castShadow = true
  boardMesh.receiveShadow = true
  group.add(boardMesh)

  const frameGeo = new THREE.BoxGeometry(3.24, 1.12, 0.02)
  const frameMesh = new THREE.Mesh(frameGeo, materials.quizFrame)
  frameMesh.position.set(0, 0, -0.015)
  group.add(frameMesh)

  // 2. Header and Question Labels (Enlarged for crisp distance reading)
  const headerLabel = makeLabel('3D SCIENCE LAB: KNOWLEDGE CHECK — Class 6–8 Physics: Gravity, Friction & Force', {
    width: 3.05,
    height: 0.16,
    fontSize: 32,
    bgColor: 'transparent',
    borderColor: 'transparent',
    color: '#22c55e',
  })
  headerLabel.position.set(0, 0.42, 0.03)
  group.add(headerLabel)

  const questionLabel = makeLabel('', {
    width: 3.05,
    height: 0.22,
    fontSize: 28,
    bgColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    textAlign: 'left',
    padding: 24,
    color: '#ffffff',
  })
  questionLabel.position.set(0, 0.22, 0.03)
  group.add(questionLabel)

  const feedbackLabel = makeLabel('', {
    width: 3.05,
    height: 0.12,
    fontSize: 26,
    bgColor: 'transparent',
    borderColor: 'transparent',
    color: '#cbd5e1',
  })
  feedbackLabel.position.set(0, -0.44, 0.03)
  group.add(feedbackLabel)

  // 3. Option Buttons (3 options) - Wide and prominent
  const OPTION_Y = [0.03, -0.12, -0.27]
  const optionMeshes = []
  const optionLabels = []

  const btnBoxGeo = new THREE.BoxGeometry(3.0, 0.12, 0.04)

  for (let i = 0; i < 3; i++) {
    const btnMesh = new THREE.Mesh(btnBoxGeo, materials.buttonSecondary.clone())
    btnMesh.position.set(0, OPTION_Y[i], 0.04)
    btnMesh.castShadow = true
    group.add(btnMesh)
    optionMeshes.push(btnMesh)

    const label = makeLabel(`Option ${i + 1}`, {
      width: 2.95,
      height: 0.11,
      fontSize: 26,
      bgColor: 'transparent',
      borderColor: 'transparent',
      textAlign: 'left',
      padding: 20,
      color: '#e4e4e7',
    })
    label.position.set(0, OPTION_Y[i], 0.065)
    group.add(label)
    optionLabels.push(label)

    interaction.register({
      mesh: btnMesh,
      onActivate: () => handleSelectOption(i),
      label: `Quiz: Select Option ${String.fromCharCode(65 + i)}`,
    })
  }

  // 4. Restart Button (initially hidden)
  const restartBtnGeo = new THREE.BoxGeometry(0.85, 0.15, 0.04)
  const restartMesh = new THREE.Mesh(restartBtnGeo, materials.buttonPrimary.clone())
  restartMesh.position.set(0, -0.08, 0.04)
  restartMesh.visible = false
  group.add(restartMesh)

  const restartLabel = makeLabel('RESTART QUIZ', {
    width: 0.82,
    height: 0.13,
    fontSize: 30,
    bgColor: 'transparent',
    borderColor: 'transparent',
    color: '#000000',
  })
  restartLabel.position.set(0, -0.08, 0.065)
  restartLabel.visible = false
  group.add(restartLabel)

  interaction.register({
    mesh: restartMesh,
    onActivate: handleRestart,
    label: 'Quiz: Restart Assessment',
  })

  function loadQuestion(index) {
    if (index >= QUESTIONS.length) {
      finishQuiz()
      return
    }

    const qData = QUESTIONS[index]
    questionLabel.update(`Question ${index + 1} of ${QUESTIONS.length}\n${qData.q}`)
    feedbackLabel.update('')

    for (let i = 0; i < 3; i++) {
      optionMeshes[i].material = materials.buttonSecondary.clone()
      optionMeshes[i].visible = true
      optionLabels[i].visible = true
      optionLabels[i].update(qData.options[i], { color: '#e4e4e7' })
    }

    restartMesh.visible = false
    restartLabel.visible = false

    stateManager.setQuiz({
      questionIndex: index,
      score,
      total: QUESTIONS.length,
      status: 'ready',
    })
  }

  function handleSelectOption(selectedIndex) {
    if (isWaitingNext || isFinished) return
    isWaitingNext = true

    const currentQ = QUESTIONS[currentIndex]
    const isCorrect = selectedIndex === currentQ.answer

    if (isCorrect) {
      score += 1
      optionMeshes[selectedIndex].material = materials.buttonCorrect.clone()
      optionLabels[selectedIndex].update(`✓  ${currentQ.options[selectedIndex]}`, { color: '#ffffff' })
      feedbackLabel.update(`✓ Correct! ${currentQ.explain}`, { color: '#22c55e' })
    } else {
      optionMeshes[selectedIndex].material = materials.buttonWrong.clone()
      optionLabels[selectedIndex].update(`✗  ${currentQ.options[selectedIndex]}`, { color: '#fca5a5' })
      optionMeshes[currentQ.answer].material = materials.buttonCorrect.clone()
      optionLabels[currentQ.answer].update(`✓  ${currentQ.options[currentQ.answer]}`, { color: '#ffffff' })
      feedbackLabel.update(`✗ Incorrect. ${currentQ.explain}`, { color: '#ef4444' })
    }

    stateManager.setQuiz({
      questionIndex: currentIndex,
      score,
      total: QUESTIONS.length,
      status: 'feedback',
    })

    // Advance after 1.5 s
    setTimeout(() => {
      currentIndex += 1
      isWaitingNext = false
      loadQuestion(currentIndex)
    }, 1500)
  }

  function finishQuiz() {
    isFinished = true
    for (let i = 0; i < 3; i++) {
      optionMeshes[i].visible = false
      optionLabels[i].visible = false
    }

    const pct = Math.round((score / QUESTIONS.length) * 100)
    questionLabel.update(
      `Assessment Complete!\nFinal Score: ${score} / ${QUESTIONS.length} (${pct}%)\nResults transmitted to student offline ledger.`
    )
    feedbackLabel.update('Great job completing the 3D physics inquiry modules!')

    restartMesh.visible = true
    restartLabel.visible = true

    stateManager.setQuiz({
      questionIndex: QUESTIONS.length,
      score,
      total: QUESTIONS.length,
      status: 'finished',
    })

    // POST results to /api/results as specified
    const village = (() => {
      try {
        return localStorage.getItem('gs_village') || 'Lab'
      } catch {
        return 'Lab'
      }
    })()

    fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lessonId: 0,
        lessonTitle: '3D Science Lab Quiz',
        village,
        score,
        total: 5,
        at: Date.now(),
      }),
    }).catch((err) => {
      console.warn('3D Lab quiz result post failed (offline mode active):', err)
    })
  }

  function handleRestart() {
    currentIndex = 0
    score = 0
    isFinished = false
    isWaitingNext = false
    loadQuestion(0)
  }

  // Load first question
  loadQuestion(0)

  scene.add(group)

  function update() {
    // Static board, no physics tick required
  }

  function dispose() {
    scene.remove(group)
    optionMeshes.forEach((mesh) => interaction.unregister(mesh))
    interaction.unregister(restartMesh)

    headerLabel.dispose()
    questionLabel.dispose()
    feedbackLabel.dispose()
    optionLabels.forEach((lbl) => lbl.dispose())
    restartLabel.dispose()

    boardGeo.dispose()
    frameGeo.dispose()
    btnBoxGeo.dispose()
    restartBtnGeo.dispose()
    restartMesh.material.dispose()
  }

  return {
    group,
    update,
    handleRestart,
    dispose,
  }
}
