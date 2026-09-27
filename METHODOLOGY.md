# METHODOLOGY.md: Mathematical, Meteorological & Algorithmic Formulations
## Project: VarshaPurvanumanAI (SIH26080)
**Version:** 2.0.0  
**Scientific Discipline:** Atmospheric Science, Statistical Hydrometeorology, Machine Learning  

---

## 1. Meteorological Problem Formulation

Numerical Weather Prediction (NWP) models (such as NOAA GFS, ECMWF IFS, and NCMRWF NCUM) solve the governing Navier-Stokes hydrodynamic equations coupled with parameterized subgrid-scale physics on discrete spatial grids. Over the Indian subcontinent during the Southwest Monsoon (June–September), systematic forecast errors arise due to:
1. **Convective Parameterization Deficiencies**: Inability of coarse grids ($\ge 12\text{ km}$) to resolve individual deep convective plumes and mesoscale convective systems (MCSs).
2. **Complex Orographic Interplay**: Underestimation of steep terrain gradients along the Western Ghats and Himalayan foothills, causing spatial displacement of precipitation maxima.
3. **Regime Dependency of Systematic Biases**: A single linear or machine learning correction trained globally exhibits severe degradation when the synoptic regime shifts (e.g., active monsoon vs. break monsoon, or open maritime convection vs. continental monsoon depression).

To resolve this, VarshaPurvanumanAI introduces a **regime-aware, multi-stage post-processing architecture**.

---

## 2. Weather Regime Classification & Synoptic Decomposition

### 2.1. Eight-Class Regime Taxonomy
The platform partitions the continuous atmospheric state space into 8 meteorologically defined classes:
$$\Omega = \{\text{ACTIVE\_MONSOON}, \text{BREAK\_MONSOON}, \text{MONSOON\_LOW}, \text{DEPRESSION}, \text{COASTAL\_RAINFALL}, \text{OROGRAPHIC\_RAINFALL}, \text{WESTERN\_DISTURBANCE}, \text{OTHER}\}$$

### 2.2. Hierarchical Synoptic Multi-Label Decomposition
Rather than treating regimes as mutually exclusive flat classes, the physical atmosphere is decomposed along three independent thermodynamic and dynamical axes:
$$\mathbf{X}_{\text{synoptic}} = \langle S_{\text{macro}}, S_{\text{dist}}, S_{\text{topo}} \rangle$$

1. **Macro-Scale Monsoonal State ($S_{\text{macro}}$)**:
   - Evaluated by the Monsoon Trough Index (MTI) and the Low-Level Jet (LLJ) kinetic energy:
     $$I_{\text{LLJ}} = \sqrt{U_{850}^2 + V_{850}^2}$$
     $$\begin{cases} 
     S_{\text{macro}} = \text{Active}, & \text{if } I_{\text{LLJ}} \ge 15.0\text{ m/s and } \Delta P_{\text{N-S}} \ge 3.0\text{ hPa} \\
     S_{\text{macro}} = \text{Break}, & \text{if } I_{\text{LLJ}} < 8.0\text{ m/s and trough shifted to Himalayan foothills} \\
     S_{\text{macro}} = \text{Transitional}, & \text{otherwise}
     \end{cases}$$

2. **Synoptic Disturbance State ($S_{\text{dist}}$)**:
   - Evaluated by 850 hPa relative vorticity ($\zeta_{850} = \frac{\partial V}{\partial x} - \frac{\partial U}{\partial y}$) and mean sea level pressure deficit ($\Delta MSLP$):
     $$\begin{cases}
     S_{\text{dist}} = \text{Depression}, & \text{if } \zeta_{850} \ge 4.0 \times 10^{-5}\text{ s}^{-1} \text{ and } \Delta MSLP \le -4.0\text{ hPa} \\
     S_{\text{dist}} = \text{Monsoon Low}, & \text{if } \zeta_{850} \ge 2.0 \times 10^{-5}\text{ s}^{-1} \text{ and } -4.0 < \Delta MSLP \le -2.0\text{ hPa} \\
     S_{\text{dist}} = \text{Western Disturbance}, & \text{if } \text{Lat} \ge 26.0^\circ\text{N, upper tropospheric trough, and } U_{200} > 30\text{ m/s} \\
     S_{\text{dist}} = \text{None}, & \text{otherwise}
     \end{cases}$$

3. **Meso-Topographic State ($S_{\text{topo}}$)**:
   - Evaluated by the terrain slope vector ($\nabla Z_s$) and cross-barrier moisture flux vector ($\mathbf{Q}_{\text{flux}} = q \mathbf{V}_{850}$):
     $$F_{\text{orographic}} = \mathbf{Q}_{\text{flux}} \cdot \nabla Z_s$$
     $$\begin{cases}
     S_{\text{topo}} = \text{Orographic}, & \text{if } F_{\text{orographic}} > \theta_{\text{topo}} \text{ (steep windward ascent)} \\
     S_{\text{topo}} = \text{Coastal}, & \text{if } \text{Distance to Coast} < 50\text{ km and land-sea breeze thermal gradient present} \\
     S_{\text{topo}} = \text{Inland Plain}, & \text{otherwise}
     \end{cases}$$

### 2.3. Posterior Probability Formulation
The conditional posterior probability for each primary regime $\omega_k \in \Omega$ given feature vector $\mathbf{x}$ is computed via Bayesian combination:
$$P(\omega_k \mid \mathbf{x}) = \frac{P(\mathbf{x} \mid \omega_k) P(\omega_k)}{\sum_{j=1}^8 P(\mathbf{x} \mid \omega_j) P(\omega_j)}$$
Satisfying the simplex condition: $\sum_{k=1}^8 P(\omega_k \mid \mathbf{x}) = 1.0$ and $P(\omega_k \mid \mathbf{x}) \ge 0$.

---

## 3. Regime-Aware Post-Processing & Fallback Routing

### 3.1. Post-Processing Formulation
Let $y_{\text{nwp}} \in \mathbb{R}^+$ denote the raw NWP forecast rainfall, and let $\mathbf{x} \in \mathbb{R}^d$ denote the meteorological predictor vector (temperature, humidity, CAPE, wind speed, pressure, surface elevation). The post-processed rainfall $\hat{y}$ is estimated as:
$$\hat{y} = f_{\omega^*}(y_{\text{nwp}}, \mathbf{x})$$
where $\omega^* = \arg\max_{\omega \in \Omega} P(\omega \mid \mathbf{x})$.

### 3.2. Fallback Hierarchy
In the event that a specialized regime model $\mathcal{M}_{\omega}$ has insufficient training support ($N_{\text{train}}(\omega) < N_{\text{min}} = 50$) or exhibits non-convergent validation loss, the system dynamically routes through an authoritative physical fallback graph:
$$\text{Fallback Routing: } \begin{cases}
\text{MONSOON\_LOW} \longrightarrow \text{DEPRESSION} \longrightarrow \text{GLOBAL\_BASELINE} \\
\text{OROGRAPHIC\_RAINFALL} \longrightarrow \text{COASTAL\_OROGRAPHIC} \longrightarrow \text{GLOBAL\_BASELINE} \\
\text{COASTAL\_RAINFALL} \longrightarrow \text{COASTAL\_OROGRAPHIC} \longrightarrow \text{GLOBAL\_BASELINE} \\
\text{WESTERN\_DISTURBANCE} \longrightarrow \text{GLOBAL\_BASELINE} \\
\text{OTHER} \longrightarrow \text{GLOBAL\_BASELINE}
\end{cases}$$

---

## 4. Probabilistic Heavy Rainfall Calibration

Operational emergency management requires reliable probabilities of exceeding categorical thresholds:
$$T \in \{2.5, 7.5, 15.6, 64.5, 115.6\}\text{ mm}$$

### 4.1. Uncalibrated Model
A Gradient Boosting Classifier trains raw decision trees minimizing binary cross-entropy:
$$\mathcal{L} = -\sum_{i=1}^N \left[ y_i \log p_i + (1 - y_i) \log (1 - p_i) \right]$$
where $y_i = \mathbb{I}(R_{\text{obs}, i} \ge T)$.

### 4.2. Platt Sigmoid Calibration
Raw classifier scores $z_i$ are mapped into calibrated probabilities $P(R \ge T \mid \mathbf{x})$ via a sigmoid transformation:
$$P(R \ge T \mid z_i) = \frac{1}{1 + \exp(A z_i + B)}$$
Parameters $A, B \in \mathbb{R}$ are estimated via maximum likelihood on a held-out calibration fold.

### 4.3. Brier Score & Murphy Decomposition
Calibration quality is evaluated using the Brier Score ($BS$):
$$BS = \frac{1}{N} \sum_{i=1}^N \left( p_i - y_i \right)^2$$
Decomposed into Reliability ($REL$), Resolution ($RES$), and Uncertainty ($UNC$):
$$BS = REL - RES + UNC$$
where:
$$REL = \sum_{k=1}^K \frac{n_k}{N} (\bar{p}_k - \bar{y}_k)^2, \quad RES = \sum_{k=1}^K \frac{n_k}{N} (\bar{y}_k - \bar{y})^2, \quad UNC = \bar{y}(1 - \bar{y})$$
A well-calibrated forecast minimizes $REL \to 0$ while maximizing $RES$.

---

## 5. Spatial District Aggregation Algorithm

Gridded NWP cells (0.25° resolution) must be aggregated to irregular administrative district boundaries.

```
       District Boundary Polygon (D)
   +------------------------------------+
   |   (Cell 1)           (Cell 2)      |
   |   +----------+      +----------+   |
   |   |   w1     |      |    w2    |   |
   |   +----------+      +----------+   |
   |                                    |
   |              (Cell 3)              |
   |           +----------+             |
   |           |    w3    |             |
   |           +----------+             |
   +------------------------------------+
```

### 5.1. Area-Weighted Intersection
Let $\mathcal{P}_D$ denote the polygon geometry of district $D$, and let $\mathcal{C}_j$ denote the spatial bounding box of NWP grid cell $j$. The intersection polygon is:
$$\mathcal{A}_j = \mathcal{P}_D \cap \mathcal{C}_j$$
The effective normalized spatial weight $w_j$ is:
$$w_j = \frac{\text{Area}(\mathcal{A}_j)}{\sum_{k \in \mathcal{K}_D} \text{Area}(\mathcal{A}_k)}, \quad \sum_{j \in \mathcal{K}_D} w_j = 1.0$$
where $\mathcal{K}_D = \{ j : \text{Area}(\mathcal{P}_D \cap \mathcal{C}_j) > 0 \}$.

### 5.2. District Aggregated Statistics
- **Area-Weighted Mean Rainfall**:
  $$\bar{R}_D = \sum_{j \in \mathcal{K}_D} w_j \hat{y}_j$$
- **Spatial Percentiles ($P_{10}, P_{50}, P_{75}, P_{90}$)**:
  Cumulative weighted distribution function:
  $$F(r) = \sum_{j \in \mathcal{K}_D, \hat{y}_j \le r} w_j$$
  $$P_\alpha = \inf \{ r : F(r) \ge \alpha / 100 \}$$
- **Spatial Coverage Percentage**:
  $$\text{Coverage } (\%) = 100 \times \sum_{j \in \mathcal{K}_D, \hat{y}_j \ge 0.1\text{ mm}} w_j$$
- **Threshold Exceedance Area Percentage**:
  $$\text{Area Exceeding } T \text{ (\%) } = 100 \times \sum_{j \in \mathcal{K}_D, \hat{y}_j \ge T} w_j$$

---

## 6. Spatial Neighborhood Verification: Fractions Skill Score (FSS)

To circumvent the traditional "double penalty" error of point-by-point verification in high-resolution models, spatial neighborhood verification is performed using Roberts and Lean (2008) Fractions Skill Score:

### 6.1. Neighborhood Fraction
For a spatial neighborhood of length scale $n \times n$ grid cells around cell $(i, j)$:
$$O_n(i, j) = \frac{1}{n^2} \sum_{k, l \in \mathcal{N}_n} \mathbb{I}(R_{\text{obs}}(k, l) \ge T)$$
$$M_n(i, j) = \frac{1}{n^2} \sum_{k, l \in \mathcal{N}_n} \mathbb{I}(R_{\text{fcst}}(k, l) \ge T)$$

### 6.2. Mean Squared Error and Skill Score
$$\text{MSE}_n = \frac{1}{N_x N_y} \sum_{i, j} \left( M_n(i, j) - O_n(i, j) \right)^2$$
$$\text{MSE}_{n, \text{ref}} = \frac{1}{N_x N_y} \left( \sum_{i, j} M_n(i, j)^2 + \sum_{i, j} O_n(i, j)^2 \right)$$
$$\text{FSS}_n = 1 - \frac{\text{MSE}_n}{\text{MSE}_{n, \text{ref}}}$$
- $\text{FSS}_n = 0$: No spatial skill.
- $\text{FSS}_n \ge 0.5 + f_0 / 2$: Useful operational spatial skill (where $f_0$ is event domain frequency).
- $\text{FSS}_n = 1$: Perfect neighborhood agreement.
