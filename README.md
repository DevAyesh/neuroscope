# 🔬 NEUROSCOPE // C++ ImGui Visual Neural Network Debugger

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-15%2F15%20Passing-emerald?style=flat-square&logo=checkmarx)](https://github.com/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)](LICENSE)
[![Zero Backend](https://img.shields.io/badge/Architecture-100%25%20Client--Side-cyan?style=flat-square)](https://vercel.com/)

> **A high-density, real-time visual debugger for deep neural networks inspired by C++ Dear ImGui, GPU profilers, and hardware logic analyzers.**  
> NeuroScope demystifies the "black box" of artificial intelligence by rendering every floating-point state—pre-activations, activation derivatives, multivariate gradients, and synaptic weights—at a fluid 60 frames per second directly in the browser with **zero Python dependencies and zero backend roundtrips**.

---

## 📑 Table of Contents

- [1. Philosophy & C++ ImGui Inspiration](#1-philosophy--c-imgui-inspiration)
- [2. System Architecture & ASCII Diagram](#2-system-architecture--ascii-diagram)
- [3. The 6 Core Educational Learning Outcomes](#3-the-6-core-educational-learning-outcomes)
  - [Outcome 1: Demystifying the Black Box](#outcome-1-demystifying-the-black-box)
  - [Outcome 2: Non-Linearity & Space Warping](#outcome-2-non-linearity--space-warping)
  - [Outcome 3: Pathological Failure Modes (Dying ReLU & Vanishing Gradients)](#outcome-3-pathological-failure-modes-dying-relu--vanishing-gradients)
  - [Outcome 4: Visual Calculus & The Multivariate Chain Rule](#outcome-4-visual-calculus--the-multivariate-chain-rule)
  - [Outcome 5: Fault Tolerance & Self-Healing via Neuron Ablation](#outcome-5-fault-tolerance--self-healing-via-neuron-ablation)
  - [Outcome 6: Hyperparameter Dynamics & Optimization Intuition](#outcome-6-hyperparameter-dynamics--optimization-intuition)
- [4. Feature Documentation](#4-feature-documentation)
  - [The 5 Sandbox Presets](#the-5-sandbox-presets)
  - [Interactive Spotlight Guided Tour](#interactive-spotlight-guided-tour)
  - [Custom 2D Dataset Drawing Pad](#custom-2d-dataset-drawing-pad)
  - [Web Audio API Sonification Engine](#web-audio-api-sonification-engine)
  - [In-App Learning Guide & Outcomes Modal](#in-app-learning-guide--outcomes-modal)
  - [Deep State URL Serialization](#deep-state-url-serialization)
- [5. Visual & Acoustic Grammar Reference](#5-visual--acoustic-grammar-reference)
- [6. Local Setup & Quickstart](#6-local-setup--quickstart)
- [7. Test Suite Instructions (15/15 Passing)](#7-test-suite-instructions-1515-passing)
- [8. Zero-Backend Vercel Deployment Guide](#8-zero-backend-vercel-deployment-guide)
- [9. Pedagogical Use & Educator Lab Guide](#9-pedagogical-use--educator-lab-guide)

---

## 1. Philosophy & C++ ImGui Inspiration

In modern deep learning education and research, neural networks are almost exclusively treated as opaque, batch-oriented abstractions wrapped in heavy Python libraries (`torch.nn`, `tensorflow.keras`). Training loops dump sparse terminal printouts (`loss: 0.2314 - acc: 0.892`) every epoch, while gradient descent is viewed as an invisible optimizer operating in a multidimensional void.

**NeuroScope rejects the black-box paradigm.**

Inspired by the tactile immediacy of **C++ Dear ImGui** visual debuggers, the **Tracy Profiler**, and hardware oscilloscopes, NeuroScope exposes the inner mechanics of neural computation as a high-density, real-time physical simulation:
- **Immediate-Mode Telemetry:** Rather than computing offline logs, every neuron, synapse, and gradient is evaluated frame-by-frame at 60 FPS.
- **Glass-Box Observability:** Inspect any of the network's internal values on hover: scalar pre-activation dot products $z = \sum w_i x_i + b$, non-linear outputs $a = \sigma(z)$, and exact instantaneous analytical derivatives $f'(z)$.
- **Tactile Intervention:** Click to sever individual neurons (ablation testing), inject Gaussian weight jitter, perturb learning rates on live sliders, or step through mathematical equations with millisecond precision.
- **Zero-Bloat Pure TypeScript Engine:** Written completely from scratch in TypeScript. No Pyodide WebAssembly downloads, no external math dependencies, no server API roundtrips. 100% self-contained in a sub-150KB client bundle.

---

## 2. System Architecture & ASCII Diagram

NeuroScope is structured around a decoupled unidirectional reactive pipeline: the mathematical core executes independently of rendering, communicating through a unified Zustand reactive state deck that synchronizes high-throughput HTML5 2D Canvas rendering, the Web Audio synthesizer, and the Next.js control viewports.

```
+==================================================================================================+
|                                    NEUROSCOPE RUNTIME ENGINE                                     |
+==================================================================================================+
|                                                                                                  |
|   +------------------------------------------------------------------------------------------+   |
|   | 1. TOP CONTROL & TELEMETRY BAR (TopControlBar.tsx)                                       |   |
|   |  [Brand HUD]  [Preset Dropdown]  [Interactive Lesson]  [Learning Guide]  [Train/Pause/Step] |   |
|   |  [Learning Rate Slider: 0.0001 - 1.0]  [Activation: ReLU/Tanh/Sigmoid]  [Share URL Link]   |   |
|   +------------------------------------------------------------------------------------------+   |
|                                            |                                                     |
|         +----------------------------------+----------------------------------+                  |
|         |                                                                     |                  |
|         v                                                                     v                  |
|   +----------------------------+   +---------------------------------------------------------+   |
|   | CONTROL SIDEBAR            |   | 60 FPS HTML5 NETWORK CANVAS VIEWPORT (NetworkCanvas)    |   |
|   | (ControlSidebar.tsx)       |   |                                                         |   |
|   |                            |   |  (L0: Input Sensor)     (L1: Hidden)      (L2: Output)  |   |
|   | - Dynamic Layer Editor     |   |   +---+                  +---+             +---+        |   |
|   |   [+ Layer] [- Layer]      |   |   |Osc|-[x0]====(w00)====|N00|====(w10)====|Out| [0.94] |   |
|   | - Neuron Count Spinners    |   |   +---+   \\            / +---+           / +---+        |   |
|   | - Optimizer Toggle         |   |            \\==(w01)==//       \\==(w11)==//              |   |
|   |   [SGD | Momentum]         |   |   +---+     \\        //    +---+        //    +---+        |   |
|   | - Dropout Rate Slider      |   |   |Osc|-[x1]====(w02)====|N01|====(w12)====|Out| [0.06] |   |
|   | - Perturb / Jitter Noise   |   |   +---+                  +---+             +---+        |   |
|   | - Reset Weights (He/Xavier)|   |                                                         |   |
|   +----------------------------+   |  * Smooth Camera Transform (Pan/Zoom: 45% - 200%)       |   |
|                                    |  * Cubic Bezier Splines (Amber: w>0, Crimson: w<0)      |   |
|                                    |  * Forward Particles: a_i * w_ij (Yellow/Cyan)          |   |
|                                    |  * Backward Error Particles: dL/dz (Magenta/Red)        |   |
|                                    +---------------------------------------------------------+   |
|                                                                     |                            |
|         +-----------------------------------------------------------+                            |
|         |                                                                                        |
|         v                                                                                        |
|   +------------------------------------------------------------------------------------------+   |
|   | FLOATING NEURON INSPECTOR HUD (NeuronInspector.tsx)                                      |   |
|   | - Scalar Dot Product Inspector: z = ∑(w_i * a_i) + b                                     |   |
|   | - Dynamic Activation Function Graph: Interactive Tangent Line showing f'(z) slope        |   |
|   | - Individual Neuron Ablation Switch: Sever connection [Kill / Revive]                    |   |
|   +------------------------------------------------------------------------------------------+   |
|                                            |                                                     |
|         +----------------------------------+----------------------------------+                  |
|         |                                                                     |                  |
|         v                                                                     v                  |
|   +----------------------------------------------------------+  +----------------------------+   |
|   | DIAGNOSTICS & TELEMETRY DECK (DiagnosticsDrawer.tsx)     |  | WEB AUDIO SYNTH DECK       |   |
|   |                                                          |  | (audio-synth.ts)           |   |
|   |  [Loss & Accuracy Plot]    [2D Manifold Heatmap & Pad]   |  | - Triangle C3 / Sine G3    |   |
|   |   - Live 100-epoch history  - 32x32 live decision grid   |  |   Loss convergence drone   |   |
|   |   - Dual-axis graph         - Cyan / Amber coordinate pad|  | - 58Hz Sawtooth Buzzer     |   |
|   |                                                          |  |   Dying ReLU necrosis alert|   |
|   |  [Step Math X-Ray Mode]    [Kernel Terminal Logs]        |  | - Forward / Backward       |   |
|   |   - 5-Phase Cycle Cards     - Real-time timestamped logs |  |   acoustic inference clicks|   |
|   |   - Analytical Derivatives  - Necrotic warning alerts    |  | - Autoplay safe / Muteable |   |
|   +----------------------------------------------------------+  +----------------------------+   |
|                                            |                                                     |
|         +----------------------------------+----------------------------------+                  |
|         |                                                                     |                  |
|         v                                                                     v                  |
|   +----------------------------------------------------------+  +----------------------------+   |
|   | PURE TYPESCRIPT AUTOGRAD ENGINE (nn-engine.ts)           |  | ZUSTAND REACTIVE STORE     |   |
|   | - Dynamic N-Layer Multi-Layer Perceptron (MLP)           |  | (useNetworkStore.ts)       |   |
|   | - Forward pass with Inverted Dropout scaling             |  | - Deep URL state sync      |   |
|   | - Analytical backpropagation via Calculus Chain Rule     |  | - Dual-target spotlighting |   |
|   | - Finite-Difference Numerical Gradient Verifier          |  | - 15/15 Test Verification  |   |
|   | - Non-mutating predict() for instant 32x32 sweeps        |  | - Zero external DL libs    |   |
|   +----------------------------------------------------------+  +----------------------------+   |
+==================================================================================================+
```

---

## 3. The 6 Core Educational Learning Outcomes

NeuroScope's curriculum addresses 6 core theoretical challenges in machine learning education.

```
       [ 01: Demystify ]           [ 02: Non-Linearity ]           [ 03: Necrosis & Decay ]
     Glass-box telemetry &       Why linear layers collapse;     Dying ReLU (f'=0) & Sigmoid
      exact scalar products.      folding Euclidean space.       decay across deep layers.
                |                           |                               |
                +---------------------------+-------------------------------+
                                            |
                                            v
                +---------------------------+-------------------------------+
                |                           |                               |
       [ 04: Visual Calculus ]     [ 05: Fault Tolerance ]         [ 06: Hyperparameters ]
     Chain rule backprop step:   Distributed connectionist       SGD vs Momentum; saddle
      dL/dw = (dL/dz) * a_i.     resilience & self-healing.      point jitter & LR dynamics.
```

---

### Outcome 1: Demystifying the Black Box

#### The Pedagogical Problem
Introductory courses often depict deep networks as a black box where inputs enter and predictions magically emerge. This prevents students from understanding where bugs like exploding numerical outputs or dead activations originate.

#### Mathematical Foundation
NeuroScope breaks down every neuron $j$ in layer $l$ into explicit sequential steps:
1. **Pre-activation Weighted Sum ($z_j$):**
   $$z_j^{(l)} = \sum_{i=0}^{n-1} \left( w_{ij}^{(l)} \cdot a_i^{(l-1)} \right) + b_j^{(l)}$$
2. **Non-Linear Output ($a_j$):**
   $$a_j^{(l)} = \sigma\left(z_j^{(l)}\right)$$
3. **Instantaneous Analytical Derivative ($f'(z_j)$):**
   $$f'\left(z_j^{(l)}\right) = \frac{\partial a_j^{(l)}}{\partial z_j^{(l)}}$$

#### Visual & Telemetry Cues
- **Hover Inspection HUD:** Point your cursor at any neuron to inspect a detailed list of every incoming synapse, showing $w_{ij}$, incoming activation $a_i$, their scalar product $w_{ij} \cdot a_i$, and the accumulated bias $b_j$.
- **Real-Time Node Core:** The inner core radius and luminescence of each neuron directly scale with its activation value $a_j \in [0, 1]$.
- **Try It Now:** Launch the **Guided Tour** or preset **Signal Wave Classifier** to observe 17 input oscilloscopes feeding directly into 26 hidden neurons.

---

### Outcome 2: Non-Linearity & Space Warping

#### The Pedagogical Problem
Why can't a network made of 50 stacked linear layers classify an XOR gate or a spiral manifold? Students frequently struggle to explain why activation functions are necessary.

#### Mathematical Proof of Linear Collapse
Consider a 2-layer network with linear activations ($a = z$):
$$z^{(1)} = \mathbf{W}_1 \mathbf{x} + \mathbf{b}_1$$
$$z^{(2)} = \mathbf{W}_2 z^{(1)} + \mathbf{b}_2 = \mathbf{W}_2(\mathbf{W}_1 \mathbf{x} + \mathbf{b}_1) + \mathbf{b}_2 = (\mathbf{W}_2 \mathbf{W}_1)\mathbf{x} + (\mathbf{W}_2 \mathbf{b}_1 + \mathbf{b}_2)$$
Defining $\mathbf{W}' = \mathbf{W}_2 \mathbf{W}_1$ and $\mathbf{b}' = \mathbf{W}_2 \mathbf{b}_1 + \mathbf{b}_2$, this collapses to:
$$z^{(2)} = \mathbf{W}' \mathbf{x} + \mathbf{b}'$$
No matter how many linear layers are added, the composite function remains an affine transformation—incapable of carving non-linear decision boundaries.

#### Non-Linear Space Warping
Non-linear activations ($\text{ReLU}, \tanh, \sigma$) fold, bend, and stretch the Euclidean input space so that complex manifolds become linearly separable in the final hidden layer's representation space.

#### Visual & Telemetry Cues
- **32x32 Live Decision Heatmap:** The diagnostics deck continuously sweeps $[-1.5, +1.5]^2$ using `engine.predict([nx, ny])`. Watch the decision contour warp in real time from rigid linear half-spaces into circular islands and spiral bands.
- **Try It Now:** Load the **2D Point Classifier & Manifold** preset (`2d_classifier`) and toggle activation between `Linear` (loss stalls at $\approx 0.25$) and `Tanh` (boundary bends around the spiral arms, loss drops to $< 0.01$).

---

### Outcome 3: Pathological Failure Modes (Dying ReLU & Vanishing Gradients)

#### The Pedagogical Problem
Deep learning architectures routinely suffer from numerical stability failures. Understanding why networks freeze or diverge requires observing gradients at the single-neuron level.

#### Failure Mode A: The Dying ReLU Problem (Necrosis)
- **Mathematical Cause:** For the standard rectified linear unit:
  $$\text{ReLU}(z) = \max(0, z), \quad \text{ReLU}'(z) = \begin{cases} 1 & z > 0 \\ 0 & z \le 0 \end{cases}$$
  If an aggressive learning rate or large negative bias pushes pre-activation $z < 0$ for all training samples in the dataset, the derivative $f'(z) = 0$ permanently:
  $$\delta_j = \frac{\partial \mathcal{L}}{\partial z_j} = \left( \sum_k \delta_k w_{jk} \right) \cdot 0 = 0$$
  Since $\Delta w_{ij} = -\eta \cdot \delta_j \cdot a_i = 0$, the weights can **never update again**. The neuron is mathematically dead.
- **Visual & Acoustic Alert:** Dead neurons turn crimson with a tombstone marker (`†`), gradients read `0.0000`, and the Web Audio synthesizer triggers a continuous **58Hz sawtooth flatline buzzer**.
- **The Cure:** Clicking **"REVIVE LEAKY"** introduces a small positive slope ($\alpha = 0.01$ for $z \le 0$), restoring non-zero gradients and reviving necrotic nodes.

#### Failure Mode B: Vanishing Gradients in Deep Networks
- **Mathematical Cause:** For Sigmoid activation:
  $$\sigma'(z) = \sigma(z)(1 - \sigma(z)) \le 0.25$$
  In a deep 6-layer network, applying the Chain Rule backwards across $L$ layers multiplies these derivatives:
  $$\prod_{l=1}^L \sigma'\left(z^{(l)}\right) \le (0.25)^L = (0.25)^6 \approx 0.000244$$
  The backpropagated error gradient decays exponentially before reaching Layer 1, freezing early representation learning.
- **Visual Cues:** In the **Vanishing vs. Exploding Gradients** preset (`vanishing_grad`), magenta backprop particles extinguished midway across the network, while Layer 1 gradient norms drop to $0.0000$. Switching to ReLU restores gradient flow throughout all 6 layers.

---

### Outcome 4: Visual Calculus & The Multivariate Chain Rule

#### The Pedagogical Problem
Backpropagation is often taught as an abstract algorithm involving matrix calculus. Students fail to realize that it is the direct application of the standard Single-Variable and Multivariate Chain Rule.

#### Step-by-Step Derivation
For Mean Squared Error loss $\mathcal{L} = \frac{1}{2}\sum_k (a_k - y_k)^2$ and output neuron $k$:
1. **Output Error Sensitivity ($\delta_k$):**
   $$\delta_k = \frac{\partial \mathcal{L}}{\partial z_k} = \frac{\partial \mathcal{L}}{\partial a_k} \cdot \frac{\partial a_k}{\partial z_k} = (a_k - y_k) \cdot \sigma'(z_k)$$
2. **Hidden Layer Error Sensitivity ($\delta_j$):**
   $$\delta_j = \frac{\partial \mathcal{L}}{\partial z_j} = \sum_{k} \left( \frac{\partial \mathcal{L}}{\partial z_k} \cdot \frac{\partial z_k}{\partial a_j} \right) \cdot \frac{\partial a_j}{\partial z_j} = \left( \sum_k \delta_k \cdot w_{jk} \right) \cdot \sigma'(z_j)$$
3. **Synaptic Weight Gradient ($\frac{\partial \mathcal{L}}{\partial w_{ij}}$):**
   $$\frac{\partial \mathcal{L}}{\partial w_{ij}} = \frac{\partial \mathcal{L}}{\partial z_j} \cdot \frac{\partial z_j}{\partial w_{ij}} = \delta_j \cdot a_i$$
4. **Weight Update:**
   $$w_{ij} \leftarrow w_{ij} - \eta \cdot \frac{\partial \mathcal{L}}{\partial w_{ij}}$$

#### Visual & Telemetry Cues
- **Step Math X-Ray Mode:** Pauses continuous training into an illuminated 5-phase deterministic cycle:
  - **Phase 1 (Input):** Normalizes the input vector $\mathbf{x}$.
  - **Phase 2 (Linear Sum):** Evaluates $z = \sum w_i x_i + b$ with gold synapse illumination.
  - **Phase 3 (Activation):** Plots the activation curve with an animated pink tangent line showing $f'(z)$.
  - **Phase 4 (Loss):** Computes scalar error $\mathcal{L}(a, y)$.
  - **Phase 5 (Backprop):** Fires a magenta backprop pulse updating weights according to $\Delta w = -\eta \delta a_i$.

---

### Outcome 5: Fault Tolerance & Self-Healing via Neuron Ablation

#### The Pedagogical Problem
Classical von Neumann software is brittle: a single flipped bit or null pointer exception crashes the entire program. How do connectionist architectures survive severe hardware damage?

#### Mathematical Formulation of Distributed Representations
Information in deep networks is not stored in a localized memory address; it is distributed across thousands of synaptic scalar weights. If neuron $k$ in layer $l$ is ablated ($a_k^{(l)} \equiv 0$):
$$\mathcal{L}_{\text{damaged}} = \mathcal{L}(\mathbf{W} \setminus \{w_{*k}\}) > \mathcal{L}_{\text{optimal}}$$
Because the loss surface $\mathcal{L}$ remains differentiable with respect to all surviving synapses, gradient descent automatically re-optimizes the remaining parameters:
$$\Delta w_{ij} = -\eta \frac{\partial \mathcal{L}_{\text{damaged}}}{\partial w_{ij}} \implies \lim_{t \to \infty} \mathcal{L}(t) \to \mathcal{L}_{\text{recovered}}$$

#### Visual & Telemetry Cues
- **Direct Canvas Ablation:** Click any neuron on the canvas to sever it. The node body is struck through with a red `X`, its outgoing synapses turn faint red, and the loss oscilloscope displays an instantaneous spike.
- **Dynamic Self-Healing:** Keep training running. Within 50–100 epochs, surviving parallel synapses increase their thickness (weights) and restore classification accuracy to $> 95\%$.
- **Try It Now:** Launch **Guided Tour Step 5** to sever neuron `L1-N0` and watch real-time signal rerouting.

---

### Outcome 6: Hyperparameter Dynamics & Optimization Intuition

#### The Pedagogical Problem
Students often view hyperparameters (learning rate $\eta$, momentum $\beta$, optimizer choice) as magical parameters tuned through trial and error rather than understanding their physical meaning on the loss surface.

#### Physical Mechanics of Optimization
- **Standard Gradient Descent (SGD):**
  $$w_{t+1} = w_t - \eta \nabla \mathcal{L}(w_t)$$
  Suffers from severe perpendicular oscillations in steep ravines with high curvature condition numbers.
- **Polyak Momentum:**
  $$v_{t+1} = \beta v_t + \eta \nabla \mathcal{L}(w_t), \quad w_{t+1} = w_t - v_{t+1}$$
  Accumulates velocity along consistent gradient directions while canceling high-frequency perpendicular chatter, accelerating through ravines and flat plateaus.
- **Weight Perturbation (Jitter):**
  $$w_{ij} \leftarrow w_{ij} + \mathcal{N}(0, \sigma^2)$$
  Injects isotropic Gaussian noise into the weight tensor to jump out of shallow local minima or saddle points.

#### Visual & Telemetry Cues
- **Real-Time Sliders:** Adjust the learning rate slider from `0.0001` to `1.0` during active training. Watch small rates cause convergence to crawl, while rates $> 0.6$ cause wild loss oscillations and Dying ReLU flatlines.
- **Optimizer Toggle:** Switch between `SGD` and `MOMENTUM` on the fly to observe how momentum smooths loss trajectories.

---

## 4. Feature Documentation

### The 5 Sandbox Presets

| Preset ID | Scenario Title | Architecture | Default Optimizer | Primary Pedagogical Focus |
|:---|:---|:---:|:---:|:---|
| `signal_debugger` | **Signal Wave Classifier** | `[17, 26, 16, 8]` | Momentum ($\eta=0.05$) | High-throughput sensor array, 17 input oscilloscopes, live audio drone convergence. |
| `dying_relu` | **The Dying ReLU Problem** | `[2, 16, 16, 1]` | SGD ($\eta=0.65$) | Dead neuron necrosis ($f'(z)=0$), 58Hz acoustic buzzer, recovery via Leaky ReLU. |
| `vanishing_grad` | **Vanishing Gradients Benchmark** | `[2, 12, 12, 12, 12, 12, 1]` | Momentum ($\eta=0.20$) | Deep 6-layer Sigmoid gradient attenuation, particle pulse decay, ReLU comparison. |
| `2d_classifier` | **2D Point Classifier & Manifold** | `[2, 12, 12, 2]` | Momentum ($\eta=0.08$) | 32x32 live decision heatmap, interactive custom drawing pad, space folding. |
| `step_math_xray` | **Step-by-Step Math X-Ray** | `[3, 4, 3, 2]` | SGD ($\eta=0.10$) | 5-phase deterministic cycle, exact arithmetic formulas, animated tangent lines. |

---

### Interactive Spotlight Guided Tour

The Guided Tour is a 5-step curriculum featuring dual-target SVG spotlight cutouts that guide users through key concepts:

1. **Step 1: The Input Oscilloscopes:** How continuous analog waveforms ($x_i(t) = \sin(\omega_i t + \phi)$) are quantized into normalized floating-point vectors $[-1.0, +1.0]$.
2. **Step 2: The Bezier Synapses & Weights:** How numerical weights amplify, attenuate, or invert signals through cubic Bezier splines.
3. **Step 3: Hidden Neurons & Activation Curves:** How non-linear functions bend coordinate space; opens the Neuron Inspector with an animated tangent line $f'(z)$.
4. **Step 4: Backpropagation & Gradient Descent:** Fires magenta error particles backwards to show how the Calculus Chain Rule computes error vectors.
5. **Step 5: Fault Tolerance & Neuron Severing:** Invites the user to click and sever neuron `L1-N0`, demonstrating how the remaining network compensates.

---

### Custom 2D Dataset Drawing Pad

Integrated directly into the **2D Point Classifier** preset:
- **Left-Click / Cyan Brush:** Places Class 0 data points (mapped to target probability $[0, 1]$).
- **Right-Click / Amber Brush:** Places Class 1 data points (mapped to target probability $[1, 0]$).
- **Drag Painting:** Click and drag to rapidly draw arbitrary 2D point distributions (concentric rings, double spirals, interlocking crescents).
- **Real-Time 32x32 Heatmap:** Evaluates `engine.predict([nx, ny])` across a $32 \times 32$ grid to render the non-linear decision boundary as you draw.
- **Controls:** Includes buttons to Clear Dataset, Reset to Preset Spirals, and Toggle Brushes.

---

### Web Audio API Sonification Engine

NeuroScope translates neural network dynamics into an intuitive acoustic experience:
- **Continuous Loss Convergence Drone:** A dual-oscillator carrier (Triangle $C_3 \approx 130.81\text{ Hz}$ root + Sine $G_3 \approx 196.0\text{ Hz}$ fifth) routed through a resonant low-pass filter. As training loss drops, pitch and cutoff frequency rise and clarify.
- **Dying ReLU Necrotic Flatline Alert:** A low 58Hz sawtooth buzzer fires continuously whenever necrotic (dead) neurons are detected in ReLU architectures.
- **Inference & Backprop Pulses:** High-frequency clicks for forward inference bursts and deeper resonant blips for backpropagation error flushes.
- **Browser Autoplay Compliance:** Muted by default (`isAudioMuted = true`). Click **"AUDIO SYNTH"** in the top bar to unmute.

---

### In-App Learning Guide & Outcomes Modal

Accessible via the **"LEARNING GUIDE"** button in `TopControlBar.tsx`:
- **Theme:** Sleek obsidian card styling (`#0f141f` with `#1e293b` borders and cyan accents).
- **Tab 1: Core Learning Outcomes:** Displays all 6 core educational modules, each equipped with a **"TRY IT NOW"** button that closes the modal and loads the corresponding preset or launches the guided tour!
- **Tab 2: Glossary of Visuals & Acoustics:** Comprehensive reference for synapse colors, Bezier line thickness, oscilloscope sparklines, node colors, particle streams, and audio synth frequencies.
- **Tab 3: Educators & Lab Sharing:** Practical guidelines for classroom demonstrations, student problem sets, custom 2D drawing pad assignments, and state permalinks.
- **Keyboard Shortcuts:** Press `ESC` or click the backdrop to close anytime.

---

### Deep State URL Serialization

NeuroScope supports **zero-backend reproducible state sharing**. Clicking **"SHARE"** copies a permalink to your clipboard encoding the complete experimental setup:

```
https://neuroscope.vercel.app/?preset=2d_classifier&topology=2,12,12,2&act=tanh&lr=0.08&opt=momentum
```

When opened by a student or colleague, the application parses the query parameters and hydrates the network architecture, hyperparameters, and datasets without any server state.

---

## 5. Visual & Acoustic Grammar Reference

| Visual / Acoustic Element | Rendering State | Mathematical Interpretation |
|:---|:---|:---|
| **Amber / Yellow Bezier Spline** | Glows `#f59e0b` to `#fef08a` | Excitatory synapse with positive weight ($w_{ij} > 0$). Signals amplify. |
| **Crimson / Orange Bezier Spline**| Glows `#ef4444` to `#f97316` | Inhibitory synapse with negative weight ($w_{ij} < 0$). Signals invert. |
| **Dimmed Slate Bezier Spline** | Faint `#1e293b` ($|w| < 0.05$) | Inactive or pruned connection contributing negligible activation. |
| **Translucent Red Spline** | Faint crimson (`rgba(239, 68, 68, 0.18)`) | Connection severed due to an ablated or dropped-out neuron. |
| **Bezier Spline Thickness** | Dynamic width: $0.6\text{px} - 3.8\text{px}$ | Absolute magnitude of synaptic weight ($|w_{ij}|$). Thicker lines indicate higher throughput. |
| **Emerald Node (Layer 0)** | Green `#10b981` | Sensory input feature receiving normalized values $x_i \in [-1.0, 1.0]$. |
| **Amber Node (Hidden Layers)** | Gold `#f59e0b` (variable alpha) | Hidden layer representation. Opacity and core radius scale with $a_j = \sigma(z_j)$. |
| **Cyan Node (Output Layer)** | Cyan `#06b6d4` | Final classification class with live probability readouts. |
| **Necrotic Node Marker (`†`)** | Crimson body + `†` glyph | Dying ReLU dead neuron ($z < 0 \implies f'(z) = 0 \implies \delta = 0$). |
| **Severed Node Marker (`X`)** | Dark slate body + red `X` | Manually ablated neuron ($a \equiv 0$). |
| **Green Sparkline Oscilloscope** | Animated green wave + numeric readout | Continuous analog sensory signal $x_i(t) = \sin(\omega_i t + \phi)$ digitized into Layer 0. |
| **Yellow / Cyan Particles** | Stream forward (Left $\to$ Right) | Forward inference activation pulses: $a_i \cdot w_{ij}$. |
| **Magenta / Red Particles** | Stream backward (Right $\to$ Left) | Backpropagation error gradients: $\delta_j = \frac{\partial \mathcal{L}}{\partial z_j}$ via the Chain Rule. |
| **Dual Audio Drone** | Triangle $C_3$ + Sine $G_3$ | Real-time loss convergence tracking: pitch rises and sound clarifies as loss decreases. |
| **58Hz Sawtooth Buzzer** | Flat 58Hz acoustic buzz | Dying ReLU necrosis alert triggered when dead neurons are detected. |

---

## 6. Local Setup & Quickstart

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher (or pnpm / yarn)

### Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/ayesh/neuroscope.git
cd neuroscope
npm install
```

### Launch Development Server
Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in any modern browser (Chrome, Edge, Firefox, Safari).

### Production Build
Create an optimized production build:

```bash
npm run build
npm start
```

---

## 7. Test Suite Instructions (15/15 Passing)

NeuroScope contains a dedicated test suite verifying the mathematical autograd engine, numerical gradients, optimizer convergence, and visual state management.

Run the complete test suite:

```bash
npm test
```

### Detailed Test Breakdown

```
=== RUNNING NEUROSCOPE ENGINE TEST SUITE (test/nn-engine.test.ts) ===
[Test 1]  Verifying Activation Functions & Analytical Derivatives...
          - Validates ReLU, Leaky ReLU, Sigmoid, Tanh, and Linear forward outputs.
          - Confirms analytical derivatives match exact mathematical slopes.
          ✓ Activation functions and derivatives passed.

[Test 2]  Verifying Dynamic Architecture Construction...
          - Dynamically builds [17, 26, 16, 8] and verifies weight tensor dimensions.
          ✓ Dynamic architecture initialized properly.

[Test 3]  Verifying Forward Propagation...
          - Runs forward pass across multi-layer networks and confirms finite outputs.
          ✓ Forward pass verified.

[Test 4]  Verifying Numerical Gradients via Finite Differences...
          - Verifies analytical backprop gradients against central finite differences:
            [dL/dw] ≈ (L(w + ε) - L(w - ε)) / (2ε) with ε = 1e-5.
            Gradient check passed: analytical = -0.460642, numerical = -0.460642 (Error < 1e-7).
          ✓ Gradient check passed.

[Test 5]  Verifying Gradient Descent Convergence on XOR...
          - Trains a 2-layer network on non-linear XOR data.
          - Initial XOR Loss: 0.13706 -> Final XOR Loss: 0.00016.
          ✓ Optimizer converges properly.

[Test 6]  Verifying Neuron Dropout / Killing...
          - Tests manual neuron ablation and validates zeroed activations.
          ✓ Neuron kill/dropout intervention passed.

[Test 7]  Verifying Dying ReLU detection & Leaky ReLU revival...
          - Drives network into ReLU necrosis; detects 8 dead neurons.
          - Switches to Leaky ReLU and validates recovery of all 8 dead neurons.
          ✓ Dying ReLU detection and revival verified.

[Test 8]  Verifying Non-Mutating predict() Method...
          - Verifies predict() does not alter internal network history or state buffers.
          ✓ predict() is 100% non-mutating and safe for grid sweeps.

[Test 9]  Verifying Math X-Ray Trace Analytical Gradients...
          - Confirms step-by-step arithmetic traces output exact analytical gradients.
          ✓ Math X-Ray trace analytical gradients verified.

[Test 10] Verifying Inverted Dropout Scaling & Masking...
          - Validates training-time inverted dropout scaling factor: 1 / (1 - p).
          ✓ Inverted dropout masking verified.

[Test 11] Verifying Preset Scenarios and Datasets...
          - ✓ Preset "Signal Wave Classifier" executed cleanly.
          - ✓ Preset "The Dying ReLU Problem" executed cleanly.
          - ✓ Preset "Vanishing vs. Exploding Gradients" executed cleanly.
          - ✓ Preset "2D Point Classifier & Manifold" executed cleanly.
          - ✓ Preset "Step-by-Step Math X-Ray Mode" executed cleanly.
=== ALL 11 ENGINE TESTS PASSED SUCCESSFULLY! ===

=== RUNNING PHASE 2 UPGRADE TEST SUITE (test/phase2-features.test.ts) ===
[Test 12] Verifying Interactive Guided Tour Store State...
          - Tests 5-step navigation, clamping, step targets, and dual spotlighting.
          ✓ Interactive Guided Tour navigation & dual spotlighting passed.

[Test 13] Verifying Custom Dataset Drawing Pad...
          - Tests coordinate placement, Cyan (target [0,1]) and Amber (target [1,0]).
          - Tests rapid drag drawing and real-time decision boundary convergence.
          ✓ Custom Dataset Drawing Pad passed.

[Test 14] Verifying Web Audio Synth Muting, NaN Resilience & Audio Calls...
          - Confirms default muted state, audio toggle, and NaN/Infinity resilience.
          ✓ Web Audio API Sonification passed.

[Test 15] Verifying Neuron Killing & Revival...
          - Tests manual neuron disabling and enabling via store action.
          ✓ Neuron Kill & Self-Healing passed.
=== ALL 4 PHASE 2 TESTS PASSED SUCCESSFULLY! ===

=======================================================
TOTAL: 15 / 15 TESTS PASSING (100% SUCCESS RATE)
=======================================================
```

---

## 8. Zero-Backend Vercel Deployment Guide

NeuroScope requires **zero server-side computation**, **zero external database connections**, and **zero environment variables**. It deploys natively as a high-performance static/client web app.

### Deploying via Vercel CLI

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy directly from the project root:
   ```bash
   vercel --prod
   ```

### Deploying via GitHub Integration

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete NeuroScope educational debugger"
   git push origin main
   ```
2. Log in to [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Leave all build settings at default (`Framework Preset: Next.js`, `Build Command: next build`).
5. Click **"Deploy"**. The site will deploy across Vercel's global edge CDN in under 45 seconds.

---

## 9. Pedagogical Use & Educator Lab Guide

NeuroScope is designed as a plug-and-play laboratory tool for universities, coding bootcamps, and individual researchers.

### Sample Classroom Workflows

#### Lab 1: Finding the Dying ReLU Threshold (30 minutes)
1. Have students open the **Dying ReLU Problem** preset (`dying_relu`).
2. Ask them to increase the Learning Rate slider in increments of $0.05$ while observing the terminal logs and necrotic count.
3. **Objective:** Record the lowest learning rate that produces $> 50\%$ dead neurons within 500 epochs.
4. **Discussion:** Click **"REVIVE LEAKY"** to demonstrate how $\alpha = 0.01$ prevents gradient starvation.

#### Lab 2: Manifold Warping & Custom Datasets (45 minutes)
1. Open the **2D Point Classifier** preset (`2d_classifier`).
2. Have students click **"CLEAR"** on the drawing pad.
3. Draw two interlocking C-shaped distributions: Class 0 (Cyan) and Class 1 (Amber).
4. Start training with activation set to `Linear`. Observe the straight-line decision boundary and stalled accuracy ($\approx 50\%$).
5. Switch activation to `Tanh` or `ReLU`. Watch the boundary wrap around the non-linear cluster.

#### Lab 3: Connectionist Fault Tolerance (20 minutes)
1. Load the **Signal Wave Classifier** preset (`signal_debugger`) and train to $> 95\%$ accuracy.
2. In Hidden Layer 1, identify the two neurons with the thickest outgoing synapses.
3. Click both neurons to sever them (marked with red `X`).
4. **Observation:** Note the immediate drop in accuracy and subsequent recovery as surviving parallel pathways adjust their weights.

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute for educational, research, and commercial purposes.
