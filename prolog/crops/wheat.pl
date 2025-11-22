% wheat.pl
:- encoding(utf8).
% Lógica específica para Trigo (Key Stages)

% Estágios Críticos:
% - Tillering (Perfilhamento): Precisa de água para definir número de espigas.
% - Stem Elongation (Alongamento): Crítico.
% - Flag Leaf (Folha Bandeira): Muito Crítico.

wheat_recommendation(Location, Score, VolumeL, Advice) :-
    plant_stage(Location, Stage, Week),
    
    % Mapeamento simplificado de semanas para estágios do trigo
    ( Stage == vegetative ->
        ( Week =< 4 -> Phase = tillering ; Phase = stem_elongation )
    ; % blooming/reproductive
        Phase = flag_leaf
    ),
    
    ( Phase == tillering ->
        Advice = 'Fase de Perfilhamento: Água essencial para densidade.',
        ScoreMod = 1.1
    ; Phase == stem_elongation ->
        Advice = 'Alongamento: Alta demanda hídrica.',
        ScoreMod = 1.2
    ; Phase == flag_leaf ->
        Advice = 'Folha Bandeira: CRÍTICO. Evitar estresse a todo custo.',
        ScoreMod = 1.4
    ;
        Advice = 'Manutenção normal.',
        ScoreMod = 1.0
    ),
    
    irrigation_score(wheat, Location, BaseScore),
    Score is round(BaseScore * ScoreMod),
    suggest_volume_for_score(wheat, Location, Score, VolumeL).
