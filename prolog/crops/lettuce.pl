% lettuce.pl
:- encoding(utf8).
% Lógica específica para Alface (Tension & Vapor Demand)

% Alface é muito sensível a VPD alto (Vapor Pressure Deficit).
% Se VPD alto, planta transpira muito -> Risco de murcha -> Irrigar preventivamente.

lettuce_recommendation(Location, Score, VolumeL, Advice) :-
    % Calcula VPD se possível
    ( sensor(air_temperature_c, Location, T),
      sensor(relative_humidity_pct, Location, RH) ->
        SVP is 0.6108 * exp((17.27 * T) / (T + 237.3)),
        VPD is SVP * (1 - RH / 100.0)
    ;
        VPD = 1.0 % Default moderado
    ),
    
    ( VPD > 1.5 ->
        % VPD Alto: Perigo
        Advice = 'ALERTA: VPD Alto. Irrigação preventiva para evitar murcha.',
        ScoreMod = 1.3
    ;
        Advice = 'Condições normais.',
        ScoreMod = 1.0
    ),
    
    irrigation_score(lettuce, Location, BaseScore),
    Score is round(BaseScore * ScoreMod),
    suggest_volume_for_score(lettuce, Location, Score, VolumeL).
