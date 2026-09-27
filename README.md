# Induction Motor Condition Monitoring Dashboard

A Next.js dashboard providing interactive exploration, comparative benchmarking, and deterministic diagnostic reasoning for a physics-based reduced-order induction motor simulation.

---

### Project Scope & Model Operating Envelope

- **Reduced-Order Model**: Based on classical Krause d-q (qd0) differential equations in the stationary reference frame with literature-standard 4 kW, 400 V, 50 Hz, 4-pole squirrel-cage parameters.
- **Scenario Parameters vs. Operating Envelope**: The modeled conditions (+10% Phase A stator resistance, +50% mechanical load torque, -10% Phase C supply voltage unbalance, outer-race bearing defect, and 10% rotor electrical asymmetry) are discrete demonstrator scenarios, not an experimentally mapped continuous operational boundary.
- **No Experimental Validation**: All signals are ODE simulation outputs. There is no physical motor or benchtop testbed dataset; results demonstrate numerical and analytical dynamics rather than real-world machine health.

---

### Multi-Channel Diagnostic Discrimination & Confounder Handling

Faults and operating conditions cannot be reliably isolated with a single electrical metric. The system applies multi-channel discrimination:

1. **Stator Resistance Imbalance (+10% Phase A) vs Supply Voltage Unbalance (-10% Phase C)**: Both induce 100 Hz ($2\omega_e$) torque ripple and negative-sequence currents. They are disambiguated by checking the supply voltage sequence components—Fault 03 exhibits ~3.45% voltage unbalance, while Fault 01 voltage unbalance is 0%.
2. **Load Torque Increase (+50%) vs Internal Faults**: Increased load increases slip and fundamental current magnitude symmetrically across all three phases without causing negative-sequence unbalance or torque ripple.
3. **Rotor Electrical Asymmetry (Broken-Bar Proxy)**: Generates characteristic $(1 \pm 2s)f$ sidebands around the 50 Hz stator current fundamental ($s \approx 0.0238$, sidebands at ~47.62 Hz and ~52.38 Hz) and small torque ripple, distinguishing it from static stator asymmetries.
4. **Bearing Outer-Race Fault (BPFO Vibration Signature)**: Injected purely onto a synthetic accelerometer vibration channel ($f_{BPFO} \approx 87.49\text{ Hz}$ based on 6205-series geometry) leaving electrical ODE traces identical to healthy baseline.

---

### Verification & Consistency Status

The repository validates simulation behavior through analytical and numerical self-consistency checks:
- **Solver Convergence**: SciPy `RK45` integration reaches final step (`t_end = 1.0s` or `3.0s`) with strict tolerances (`rtol = 1e-06`, `atol = 1e-08`).
- **Steady-State Power Balance**: Relative power-balance residuals remain below $10^{-6}$ across all electrical runs.
- **Electromagnetic Torque Equilibrium**: Dynamic torque balances mechanical and viscous friction torque ($T_e - T_L - B\omega_m \approx 0$) in steady state.
- **Analytical Benchmark**: Baseline steady-state torque ($15.4577\text{ N}\cdot\text{m}$) and RMS phase current ($5.5654\text{ A}$) agree with classical equivalent circuit formulas within 0.001% for the checked healthy baseline.

---

### Engineering Decisions & Architecture

- **Reduced-Order ODE vs FEM**: System of first-order differential equations enables sub-second simulation runs and clear cause-and-effect isolation without heavy finite-element overhead.
- **Deterministic Triage vs Black-Box ML**: Diagnostic triage uses physics-grounded threshold rules and sequence component ratios rather than probabilistic models or neural networks, ensuring explainability.
- **Decoupled Vibration Channel**: Mechanical bearing impact kinematics are simulated directly as an accelerometer time series rather than coupling microscopic high-frequency compliance into the low-frequency electrical flux ODE.
- **Frontend Architecture**: Next.js (App Router), Tailwind CSS, Lucide icons, and SWR for resilient data fetching with graceful offline fallback to bundled JSON records.

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
