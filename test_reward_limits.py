from api.functions import _can_pay_news_reward, _get_comment_reward_amount


assert _can_pay_news_reward(0)
assert _can_pay_news_reward(2)
assert not _can_pay_news_reward(3)
assert _get_comment_reward_amount(0) == 5
assert _get_comment_reward_amount(20) == 5
assert _get_comment_reward_amount(25) == 0

print("ok")
