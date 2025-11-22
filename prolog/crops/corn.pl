% corn.pl
:- encoding(utf8).
% Lógica específica para Milho (System Type)

% Eficiência do sistema afeta o volume necessário.
% system_type(Location, Type).
% Type: drip (95%), pivot (85%), furrow (60%).

corn_recommendation(Location, Score, VolumeL, Advice) :-
    ( system_type(Location, Sys) -> true ; Sys = pivot ),
    
    ( Sys == drip ->
        Eff = 0.95,
        Advice = 'Sistema Gotejamento: Alta eficiência.'
    ; Sys == pivot ->
        Eff = 0.85,
        Advice = 'Sistema Pivô Central: Eficiência padrão.'
    ; Sys == furrow ->
        Eff = 0.60,
        Advice = 'Sistema Sulco: Baixa eficiência. Aumentando volume.'
    ;
        Eff = 0.80,
        Advice = 'Sistema desconhecido.'
    ),
    
    irrigation_score(corn, Location, Score),
    
    % Ajusta volume pela eficiência (Volume / Eficiência)
    suggest_volume_for_score(corn, Location, Score, BaseVol),
    VolumeL is BaseVol / Eff.
