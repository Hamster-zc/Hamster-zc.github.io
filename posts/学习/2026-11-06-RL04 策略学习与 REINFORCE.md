---
title: RL04 策略学习与 REINFORCE
date: 2026-11-06
category: 学习
summary: REINFORCE策略学习相关概念及推导
tags: 强化学习
---

# 第5讲：策略学习与 REINFORCE

## 1. 从值函数学习走向策略学习 

DQN 先学习 $Q(s,a)$，再通过比较动作价值选择动作；策略学习直接构造参数化决策规则，并优化长期回报。连续动作难以逐一枚举，随机策略也需要直接描述动作分布，因此策略方法提供另一种表示与优化方式。

REINFORCE 直接优化策略参数，使带来较高回报的动作在相应状态下更可能被选中。**其**
**核心思想**：如果一次动作最终带来了较高回报，就提高以后在类似状态下选择该动作的概率；如果带来了较低回报，就降低选择该动作的概率

## 2. 策略的定义与基本性质 

确定性策略在每个状态给出唯一动作，可写成 $a=\mu_\theta(s)$；随机策略给出动作的条件分布 $\pi_\theta(a\mid s)$。离散动作下，该分布满足 $\pi_\theta(a\mid s)\geq0$ 与 $\sum_a\pi_\theta(a\mid s)=1$。

## 3. 参数化策略 

用参数 $\theta$（例如神经网络权重）表示策略后，学习转为优化 $\theta$。离散动作时，网络通常输出 logits，再经 Softmax 得到概率；连续动作时，网络可输出高斯分布的均值与标准差。训练中的动作由相应分布采样。

### 3.1 连续动作可以用分布表示

假设动作 $a$ 是任意实数，网络无法为每个可能的 $a$ 单独输出一个概率。选择高斯作为策略的**分布形式**后，网络只需根据当前状态 $s$ 输出均值 $\mu_\theta(s)$ 和标准差 $\sigma_\theta(s)>0$。这两个参数决定一整条密度曲线：

$$
\pi_\theta(a\mid s)=\frac{1}{\sqrt{2\pi}\sigma_\theta(s)}
\exp\!\left[-\frac{(a-\mu_\theta(s))^2}{2\sigma_\theta^2(s)}\right].
$$

公式中的 $a$ 是**候选动作的数值**。给定 $s$ 和网络输出的 $\mu_\theta(s),\sigma_\theta(s)$，代入任意 $a$ 都能求出该处的概率密度；训练时则从这条分布采样出实际执行的动作。这样，一组有限的分布参数就能定义无穷多个连续取值的采样规则。

例如机器人在数轴位置 $y=0$，要移动到目标 $2$，一次动作 $a$ 表示移动距离，奖励为 $r=-(y+a-2)^2$。若当前策略输出 $\mu=0,\sigma=1$，便从 $\mathcal N(0,1)$ 中抽取移动距离。假设抽到 $a=1.5$，执行后得到 $r=-0.25$；把 $a=1.5$ 代入上式，得到密度约 $0.130$。学习时结合这个动作的回报和 log-density 调整网络参数，使较好动作附近以后更容易被抽到。逐渐学到 $\mu\approx2$、较小的 $\sigma$，动作就会集中在目标移动距离附近。$\mu$ 控制分布中心，$\sigma$ 控制采样的分散程度。

离散动作只有有限个选项，Softmax 直接为每个选项分配概率即可；连续动作使用密度函数覆盖整个取值空间。高斯只是常用的分布形式，均值与标准差由训练学习。

## 4. 策略优化目标与策略梯度推导 
### 4.1 轨迹概率与对数导数 

令轨迹 $\tau=(s_0,a_0,r_0,\ldots,s_T)$，轨迹回报 $R(\tau)=\sum_{t=0}^{T-1}\gamma^t r_t$，优化目标为

$$
J(\theta)=\mathbb E_{\tau\sim p_\theta}[R(\tau)]=\sum p(\tau)R(\tau).
$$
其中 $p(\tau)$ 是轨迹 $\tau$ 的概率，与状态、动作、状态转移有关。

初始状态分布为 $\rho_0$，轨迹概率（略去不影响策略求导的奖励分布因子）为

$$
p_\theta(\tau)=\rho_0(s_0)\prod_{t=0}^{T-1}
\pi_\theta(a_t\mid s_t)P(s_{t+1}\mid s_t,a_t).
$$
对数导数技巧 $\nabla_\theta p=p\nabla_\theta\log p$ 将概率导数写为可采样形式：

$$
\begin{aligned}
\nabla_\theta J
&=\sum_\tau R(\tau)\nabla_\theta p_\theta(\tau)\\
&=\mathbb E_{\tau\sim p_\theta}
\left[R(\tau)\nabla_\theta\log p_\theta(\tau)\right].
\end{aligned}
$$

初始分布 $\rho_0(s_0)$ 和环境转移 $P(s_{t+1}\mid s_t,a_t)$ 不依赖策略参数，因此

$$
\nabla_\theta\log p_\theta(\tau)
=\sum_{t=0}^{T-1}\nabla_\theta\log\pi_\theta(a_t\mid s_t).
$$

所以不需要知道环境转移函数的参数导数，就能从策略的 log-probability 与采样回报估计梯度。

### 4.2 从整条轨迹回报到未来回报 

定义策略的 score function $score(a, s) = ∇_θ \log π_θ(a | s)$  ，它回答的是：如果稍微改变策略参数 θ，当前这个动作被选到的概率会怎样变化？

动作 $a_t$ 无法改变此前已产生的奖励，给定截至状态 $s_t$ 的历史后，score 的条件期望为零：

$$
\mathbb E_{a_t\sim\pi_\theta(\cdot\mid s_t)}[\nabla_\theta\log\pi_\theta(a_t\mid s_t)]
=\nabla_\theta\sum_{a_t}\pi_\theta(a_t\mid s_t)=0.
$$

$R(\tau)\sum_t\nabla\log\pi_t$ 中前 $t$ 项的前缀奖励已经是一个常数，乘以该期望为0的 score function 后为零。因此，只需保留 $\sum_{k=t}^{T-1}\gamma^k r_k=\gamma^tG_t$，其中 $G_t=\sum_{k=t}^{T-1}\gamma^{k-t}r_k$。对上节的有限回合折扣目标，得到

$$
\nabla_\theta J
=\mathbb E\left[\sum_{t=0}^{T-1}\gamma^tG_t
\nabla_\theta\log\pi_\theta(a_t\mid s_t)\right].
$$

后面的算法更新式省略外层 $\gamma^t$，写成 $G_t\nabla\log\pi$。在 $\gamma=1$ 时两者一致；若明确优化有限回合的折扣起始回报，应保留外层权重。以折扣状态访问分布表达策略梯度时，也可以把时间权重放进采样分布。后续笔记中的不带外层权重的策略梯度沿用课程常见写法。

### 4.3 回报的方差 

策略采样、状态转移和奖励噪声都会使各步奖励波动。把每步奖励拆成平均部分与随机波动：

$$
r_{t+k}=\bar r_{t+k}+\epsilon_{t+k},\qquad
G_t=\sum_k\gamma^k\bar r_{t+k}+\sum_k\gamma^k\epsilon_{t+k}.
$$

讲回报会汇集整段轨迹中的随机性：

$$
\operatorname{Var}(G_t)\;\text{示意为}\;
\sum_k\gamma^{2k}\operatorname{Var}(\bar r_{t+k})
+\sum_k\gamma^{2k}\operatorname{Var}(\epsilon_{t+k}).
$$

 $G_t$ 包含多个时间步的随机奖励，因此轨迹越长，回报受随机因素影响的机会越多；该式用于说明随机性的累积，不用于精确计算方差。

## 5. REINFORCE 算法 

### 5.1 完整回合更新、Baseline 与优势 

完整算法顺序：初始化策略 → 按当前策略采完整回合 → 从后向前用 $G_t=r_t+\gamma G_{t+1}$ 计算回报 → 累加各步 $G_t\nabla\log\pi_\theta(a_t\mid s_t)$ → 更新参数 → 使用新策略采下一批数据。原始算法仅需策略网络；加入状态 baseline 时可再训练价值估计器。

REINFORCE 使用真实完整轨迹中的 $G_t$，不使用当前价值网络对未来进行 bootstrap，因此属于 Monte Carlo 方法。

完整回报不含 bootstrap 估计误差；代价是必须等 episode 结束才能计算 $G_t$，不同轨迹得到的梯度方向也可能波动较大。

采样一批轨迹后，用样本平均近似期望，执行梯度上升：

$$
\theta\leftarrow\theta+\alpha\sum_tG_t\nabla_\theta\log\pi_\theta(a_t|s_t).
$$

#### 更新方向

- 使用原始 $G_t$ 时，正回报强化采样动作，负回报削弱它；加入 baseline 后，由 $G_t-b(s_t)$ 的正负决定方向。
- 概率变化由网络参数沿 $\nabla_\theta\log\pi_\theta(a_t\mid s_t)$ 更新产生。

为降低梯度方差，可以从每个 $G_t$ 减去只依赖状态、不依赖动作的 baseline $b(s_t)$。沿用省略外层时间权重的梯度写法，其期望为：

$$
\mathbb{E}\left[\sum_{t=0}^{T-1}(G_t-b(s_t))\nabla_\theta\log\pi_\theta(a_t|s_t)\right].
$$

#### 为什么不会改变期望梯度

固定 $s$ 后，baseline 项的期望为

$$
\begin{aligned}
\mathbb{E}_{a\sim\pi_\theta(\cdot|s)}
\left[b(s)\nabla_\theta\log\pi_\theta(a|s)\right]
&=b(s)\sum_a\pi_\theta(a|s)\frac{\nabla_\theta\pi_\theta(a|s)}{\pi_\theta(a|s)}\\
&=b(s)\nabla_\theta\sum_a\pi_\theta(a|s)\\
&=b(s)\nabla_\theta 1=0.
\end{aligned}
$$

所以与动作无关的 baseline 不改变该 score-function 估计的期望；选择合适的 baseline 可以降低梯度方差。

最常用的是状态价值函数 $b(s_t)=V^\pi(s_t)$，此时
$$
G_t-V^\pi(s_t)\approx A^\pi(s_t,a_t),
$$
也就是用“这次实际结果比该状态的平均预期好多少”作为更新权重。

### 5.2 离散动作：Softmax 策略 

#### 5.2.1 网络输出不是概率，而是 logits

假设状态 $s$ 下有 $m$ 个动作 $A=\{a_1,\ldots,a_m\}$。策略网络输出 logits

$$
z_\theta(s)=\begin{bmatrix}z_1\\z_2\\\vdots\\z_m\end{bmatrix}.
$$

Softmax 把它们变成合法的概率分布：

$$
\pi_\theta(a_i|s)=\frac{\exp(z_i)}{\sum_{j=1}^{m}\exp(z_j)}.
$$

因此始终有

$$
0<\pi_\theta(a_i|s)<1,\qquad \sum_i\pi_\theta(a_i|s)=1.
$$
#### 5.2.2 REINFORCE 中应该如何选动作

REINFORCE 不是每次取 $\arg\max_a\pi(a|s)$，而是按分布采样

$$
a_t\sim\text{Categorical}(\pi_\theta(\cdot|s_t)).
$$

若每次只取最大概率动作，其他动作没有采样机会，也无法按当前策略分布获得 REINFORCE 所需的轨迹样本。按概率采样时，低概率动作仍可能出现，环境反馈才能继续纠正策略。

#### 5.2.3 Softmax 的梯度：为什么会同时改变所有动作

对选中的动作 $a_t$，先写 $\log\pi(a_t\mid s_t)=z_{a_t}-\log\sum_j e^{z_j}$，再对任一 logit $z_k$ 求导：

$$
\frac{\partial\log\pi_\theta(a_t|s_t)}{\partial z_k}
=\mathbf{1}[k=a_t]-\pi_\theta(a_k|s_t).
$$

向量形式是

$$
\nabla_z\log\pi(a_t|s_t)=e_{a_t}-\pi(\cdot|s_t).
$$

所以：

- 对实际选中的动作，梯度为 $1-\pi(a_t|s_t)>0$；
- 对其他动作，梯度为 $-\pi(a_k|s_t)<0$；
- 乘上 $G_t$ 或优势估计后，若结果好，选中动作概率上升、其他动作相对下降；若结果差，方向整体反过来。

虽然一条轨迹只观察到一个动作的回报，但 Softmax 的归一化约束把所有动作的概率耦合起来，因此对一个 log-probability 的梯度天然会影响整条概率向量。

### 5.3 连续动作：高斯策略
#### 5.3.1 参数化

连续动作不能枚举每个动作的概率，通常令策略输出高斯分布的参数：

$$
a_t\sim\mathcal{N}(\mu_\theta(s_t),\sigma_\theta^2(s_t)).
$$

网络给出均值 $\mu_\theta(s)$ 和标准差 $\sigma_\theta(s)>0$。为了保证标准差为正，常令网络输出 $\eta_\theta(s)=\log\sigma_\theta(s)$，再取 $\sigma=e^\eta$。

一维高斯密度为

$$
\pi_\theta(a|s)=\frac{1}{\sqrt{2\pi}\sigma_\theta(s)}
\exp\left[-\frac{(a-\mu_\theta(s))^2}{2\sigma_\theta^2(s)}\right].
$$

对应的 log-probability：

$$
\log\pi_\theta(a|s)
=-\frac12\log(2\pi)-\log\sigma_\theta(s)
-\frac{(a-\mu_\theta(s))^2}{2\sigma_\theta^2(s)}.
$$

多维独立高斯时，联合 log-probability 为各维 log-probability 之和。

#### 5.3.2 对均值的梯度

固定 $\sigma$，对 $\mu$ 求导：

$$
\frac{\partial}{\partial\mu}\log\pi_\theta(a|s)
=\frac{a-\mu}{\sigma^2}.
$$

因此：

- 若采样动作 $a$ 大于当前均值，梯度倾向于把均值往更大的方向推；
- 若 $a$ 小于均值，梯度倾向于把均值往更小的方向推；
- 再乘上正的回报/优势，只强化“好动作”的方向；乘上负的优势则反向削弱它。

#### 5.3.3 对方差参数的梯度

对 $\eta=\log\sigma$，先将 $\sigma=e^\eta$ 代入 log-probability，再求导：

$$
\log\pi=-\tfrac12\log(2\pi)-\eta-\frac{(a-\mu)^2}{2e^{2\eta}}.
$$

$$
\frac{\partial}{\partial\eta}\log\pi_\theta(a|s)
=\frac{(a-\mu)^2}{\sigma^2}-1.
$$

解释：

- 若采样动作离均值较远，标准化平方误差大于 1，log-probability 对 $\eta$ 的导数为正；
- 若采样动作靠近均值，标准化平方误差小于 1，该导数为负；
- 实际更新还需乘回报或优势：正权重沿上述方向调整分散程度，负权重则反向；
- 因为 $\sigma=e^\eta$，网络学习 $\eta$ 比直接学习 $\sigma$ 更安全，不会产生负标准差。
