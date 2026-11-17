---
title: RL05 Actor-Critic 基础
date: 2026-11-07
category: 学习
summary: Actor-Critic 基础
tags: 强化学习
---

# 6.1 Actor-Critic 基础

## 1. 整体结构

Actor-Critic 是两条路线的结合：

| 模块           | 学习对象                  | 输入/输出           | 作用           |
| ------------ | --------------------- | --------------- | ------------ |
| Actor（策略网络）  | $\pi_\theta(a\mid s)$ | 输入 $s_t$，输出动作分布 | 决定采取什么动作     |
| Critic（价值网络） | $V_\phi(s)$，有时也学习 $Q$ | 输入 $s_t$，输出标量价值 | 评价当前状态/动作有多好 |

环境给出 $s_t\rightarrow a_t\rightarrow(r_t,s_{t+1})$。Critic 用奖励和下一状态修正价值估计，得到 TD error；Actor 用这个评价调整动作概率。

> Actor 学“怎么做”，Critic 学“做得怎么样”；Actor 根据 Critic 的评价改变策略，Critic 根据环境反馈修正评价。

## 2. 从 REINFORCE 走过来

参数化策略的目标为

$$
J(\theta)=\mathbb{E}_{\tau\sim\pi_\theta}[R(\tau)].
$$

REINFORCE 对轨迹中每个时间步使用完整回报

$$
G_t=\sum_{k=t}^{T-1}\gamma^{k-t}r_k
$$

并更新

$$
\theta\leftarrow\theta+\alpha G_t\nabla_\theta\log\pi_\theta(a_t|s_t).
$$

问题是：必须等 episode 结束；不同轨迹的 $G_t$ 波动很大；同一条轨迹中的样本高度相关，样本效率低。

Actor-Critic 的关键替换是：不再等待整个未来，而是用一步或多步 bootstrap 估计当前动作的好坏。

## 3. Baseline、$V$、$Q$ 和 Advantage

### 3.1 三个价值量

$$
V^\pi(s)=\mathbb{E}_\pi[G_t\mid S_t=s]
$$

表示从状态 $s$ 出发、之后遵循策略 $\pi$ 的平均回报。

$$
Q^\pi(s,a)=\mathbb{E}_\pi[G_t\mid S_t=s,A_t=a]
$$

表示在 $s$ 强制执行动作 $a$ 后，再遵循 $\pi$ 的平均回报。

$$
A^\pi(s,a)=Q^\pi(s,a)-V^\pi(s)
$$

表示这个动作相对该状态平均水平好多少：$A>0$ 应该提高概率，$A<0$ 应该降低概率。

### 3.2 为什么 baseline 不改变策略梯度

对只依赖状态的 $b(s)$：

$$
\mathbb{E}_{a\sim\pi_\theta(\cdot|s)}[b(s)\nabla_\theta\log\pi_\theta(a|s)]
=b(s)\nabla_\theta\sum_a\pi_\theta(a|s)=0.
$$

所以可以取 $b(s)=V^\pi(s)$，得到优势形式

$$
\nabla_\theta J(\theta)=
\mathbb{E}[A^\pi(s_t,a_t)\nabla_\theta\log\pi_\theta(a_t|s_t)].
$$

注意：优势不是“回报本身”，而是“回报减去状态基准”。它去掉了状态本身容易/困难的影响，只留下动作相对好坏。

## 4. 用 Bellman 方程得到 TD error

状态价值满足 Bellman 期望方程：

$$
V^\pi(s_t)=\mathbb{E}_\pi[r_t+\gamma V^\pi(s_{t+1})\mid s_t].
$$

动作价值满足

$$
Q^\pi(s_t,a_t)=\mathbb{E}_\pi[r_t+\gamma V^\pi(s_{t+1})\mid s_t,a_t].
$$

代入优势定义：

$$
\begin{aligned}
A^\pi(s_t,a_t)
&=\mathbb{E}[r_t+\gamma V^\pi(s_{t+1})\mid s_t,a_t]-V^\pi(s_t)\\
&=\mathbb{E}[r_t+\gamma V^\pi(s_{t+1})-V^\pi(s_t)\mid s_t,a_t].
\end{aligned}
$$

定义样本 TD error：

$$
\delta_t=r_t+\gamma V_\phi(s_{t+1})-V_\phi(s_t).
$$

严格地说，$\delta_t$ 不等于真实 Advantage；当 $V_\phi=V^\pi$ 时，才有

$$
\mathbb{E}[\delta_t\mid s_t,a_t]=A^\pi(s_t,a_t).
$$

因此 TD error 是 Advantage 的低成本样本估计。

## 5. Critic 如何学习

终止状态不能再引导到下一状态价值。用 $d_t=1$ 表示终止，$d_t=0$ 表示未终止：

$$
y_t=r_t+\gamma(1-d_t)V_\phi(s_{t+1}).
$$

Critic 的平方损失：

$$
L_{\text{Critic}}(\phi)=\frac12\left(V_\phi(s_t)-y_t\right)^2.
$$

参数用梯度下降：

$$
\phi\leftarrow\phi-\alpha_\phi\nabla_\phi L_{\text{Critic}}.
$$

实现时要把 $y_t$ 视为 target，通常对它 `detach`（在这次反向传播结束前不接受梯度的调整），否则梯度会同时穿过目标中的下一状态价值，破坏“用目标监督当前估计”的语义。

TD error 也可写成

$$
\delta_t=y_t-V_\phi(s_t).
$$

## 6. Actor 如何学习

策略梯度的 Advantage 形式在某一时刻是

$$
\nabla_\theta J(\theta)
\approx\delta_t\nabla_\theta\log\pi_\theta(a_t|s_t).
$$

所以梯度上升更新为

$$
\theta\leftarrow\theta+\alpha_\theta\delta_t
\nabla_\theta\log\pi_\theta(a_t|s_t).
$$

工程中通常统一用梯度下降，定义

$$
L_{\text{Actor}}(\theta)=-\operatorname{sg}(\delta_t)\log\pi_\theta(a_t|s_t),
$$

其中 $\operatorname{sg}$ 表示 stop-gradient/detach：Actor 更新时把 TD error 当作常数，不让 Actor 的反向传播改变 Critic。

符号检查：

- $\delta_t>0$：实际结果比 Critic 预期好，最小化损失会提高 $\log\pi(a_t|s_t)$，即提高该动作概率。
- $\delta_t<0$：实际结果较差，更新会降低该动作概率。

## 7. 偏差-方差权衡

| 方法 | 权重 | 偏差 | 方差 | 是否等 episode 结束 |
| --- | --- | --- | --- | --- |
| REINFORCE | $G_t$ | 低 | 高 | 是 |
| 一步 Actor-Critic | $r_t+\gamma V(s_{t+1})-V(s_t)$ | 较高，取决于 Critic | 较低 | 否 |
| n-step | 多步奖励 + 末端 bootstrap | 中等 | 中等 | 通常否 |
| Monte Carlo | 完整奖励和 | 低 | 高 | 是 |

Critic 不准确时，Actor 收到的优势估计也会错误，所以“降低方差”并不等于“绝对更好”；需要通过 Critic loss、学习率、n-step 长度等稳定训练。

## 8. n-step Actor-Critic 与 GAE

### 8.1 n-step return

一步 TD target 是

$$
G_t^{(1)}=r_t+\gamma V(s_{t+1}).
$$

n-step target 为

$$
G_t^{(n)}=\sum_{k=0}^{n-1}\gamma^k r_{t+k}+\gamma^n V(s_{t+n}).
$$

前 $n$ 个奖励来自真实环境，最后一项由 Critic 对更远状态 bootstrap。$n$ 越小越像一步 TD，方差低但偏差更依赖 Critic；$n$ 越大越接近 Monte Carlo，偏差降低但方差增加。

用它估计优势：

$$
A_t^{(n)}=G_t^{(n)}-V(s_t).
$$

### 8.2 GAE

定义每一步 TD residual：

$$
\delta_t=r_t+\gamma(1-d_t)V(s_{t+1})-V(s_t).
$$

广义优势估计（GAE）把未来 residual 按 $\gamma\lambda$ 加权：

$$
\hat A_t^{\text{GAE}(\gamma,\lambda)}
=\sum_{l=0}^{T-t-1}(\gamma\lambda)^l\delta_{t+l}.
$$

$\lambda$ 控制偏差-方差折中：$\lambda=0$ 近似一步 TD，$\lambda\approx1$ 更接近 Monte Carlo。实际实现从 rollout 末端反向递推：

$$
\hat A_t=\delta_t+\gamma\lambda(1-d_t)\hat A_{t+1}.
$$

## 9. 一步 Actor-Critic 算法过程

1. 观察状态 $s_t$。
2. Actor 输出 $\pi_\theta(\cdot|s_t)$，按分布采样 $a_t$。
3. 与环境交互，得到 $r_t,s_{t+1},d_t$。
4. Critic 计算 $V_\phi(s_t),V_\phi(s_{t+1})$。
5. 计算 $y_t=r_t+\gamma(1-d_t)V_\phi(s_{t+1})$。
6. 计算 $\delta_t=y_t-V_\phi(s_t)$。
7. 更新 Critic：$\phi\leftarrow\phi-\alpha_\phi\nabla L_C$。
8. 更新 Actor：$\theta\leftarrow\theta+\alpha_\theta\delta_t\nabla\log\pi_\theta(a_t|s_t)$。
9. 令 $s_t\leftarrow s_{t+1}$，继续交互。
