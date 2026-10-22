-- SPDX-License-Identifier: GPL-3.0-or-later
-- Read-only transport test: return the string without changing the place.
-- Change count to 400 to test retained-result pagination.
local count = 40
local lines = {"<<<START_TESTU>>>"}
for i = 1, count do
    lines[#lines + 1] = string.format("LINIA_%03d | 0123456789 ABCDEFGHIJ 0123456789", i)
end
lines[#lines + 1] = "<<<KONIEC_TESTU>>>"
lines[#lines + 1] = 'local Players = game:GetService("Players")'
lines[#lines + 1] = 'local TICKETS = { ["test"] = 2.30 } -- sample data, not the project tariff'
lines[#lines + 1] = "<<<KONIEC_FRAGMENTU>>>"
return table.concat(lines, "\n")
