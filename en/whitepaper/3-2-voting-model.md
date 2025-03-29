# 3.2 Mathematical Model: Voting Mechanism

The voting mechanism of the TLF Protocol is built on a scientific mathematical model, ensuring fairness, transparency, and efficiency in the governance process.

## 3.2.1 Voting Power Allocation

A player's voting power $V_i$ is related to the amount of ERC20 tokens staked $T_i$ and the staking duration $D_i$, calculated as:

$$V_i = T_i \cdot (1 + \alpha \cdot \log(1 + D_i))$$

Where:
- $V_i$ is the voting weight of player $i$
- $T_i$ is the number of tokens staked by the player
- $D_i$ is the staking duration (in days)
- $\alpha$ is the time weight coefficient (typically set between 0.1~0.3)

This calculation method not only considers players' economic contributions but also encourages long-term holding and participation, helping to form a stable community governance structure.

## 3.2.2 Event Weight Calculation

The weight $W_j$ of each event $E_j$ is obtained by summing the weighted votes of all voters:

$$W_j = \sum_{i=1}^{n} V_i \cdot w_{ij}$$

Where:
- $W_j$ is the total weight of event $E_j$
- $V_i$ is the voting weight of player $i$
- $w_{ij}$ is the vote value of player $i$ for event $E_j$ (ranging from -1 to 1)
- $n$ is the total number of participating players

## 3.2.3 Event Selection Algorithm

The TLF Protocol uses a multi-round voting approach, selecting the top $k$ highest-weighted events in each voting cycle. The selection process can be represented as:

$$\text{Selected Events} = \{E_j | \text{Rank}(W_j) \leq k \text{ and } W_j > W_{min}\}$$

Where:
- $\text{Rank}(W_j)$ is the position of event $E_j$ in the weight ranking
- $k$ is the maximum number of selectable events per round
- $W_{min}$ is the minimum weight threshold for events

Additionally, to prevent the risk of minority capital control, TLF introduces a quadratic voting mechanism, making voting weight proportional to the square root of staked tokens:

$$V_i^* = \sqrt{V_i}$$

This mechanism significantly reduces the risk of large capital manipulating governance, making the process more democratic.

## 3.2.4 Voting Cycle and Adjustment Mechanism

The TLF Protocol implements a dynamic voting cycle $P$, whose length automatically adjusts based on game activity and governance needs:

$$P_{new} = P_{old} \cdot \left(1 + \beta \cdot \left(\frac{N_{actual}}{N_{expected}} - 1\right)\right)$$

Where:
- $P_{new}$ is the new voting cycle length
- $P_{old}$ is the original voting cycle length
- $N_{actual}$ is the actual number of participating players
- $N_{expected}$ is the expected number of participating players
- $\beta$ is the adjustment coefficient (typically set between 0.2~0.5)

This dynamic adjustment mechanism ensures that the voting cycle can adapt to the actual participation level of the game community, maintaining governance activity while avoiding negative impacts from overly frequent or sparse voting.
