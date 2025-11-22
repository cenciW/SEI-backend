% tomato.pl
:- encoding(utf8).
% Lógica específica para Tomate (Balance Vegetative/Generative)

% O usuário pode definir uma meta explícita: growth_goal(Location, Goal).
% Goal = vegetative (crescer planta) ou generative (dar fruto).

tomato_recommendation(Location, Score, VolumeL, Advice) :-
    ( growth_goal(Location, Goal) -> true ; Goal = balanced ),
    
    ( Goal == generative ->
        Advice = 'Meta Generativa: Reduzindo frequência para induzir fruto.',
        ScoreMod = 0.85 % Mais difícil atingir o limiar de rega
    ; Goal == vegetative ->
        Advice = 'Meta Vegetativa: Água abundante para crescimento.',
        ScoreMod = 1.15
    ;
        Advice = 'Crescimento balanceado.',
        ScoreMod = 1.0
    ),
    
    irrigation_score(tomato, Location, BaseScore),
    Score is round(BaseScore * ScoreMod),
    suggest_volume_for_score(tomato, Location, Score, VolumeL).
