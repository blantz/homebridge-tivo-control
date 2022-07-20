# Tivo Network Remote Control Protocol

This protocol defines 5 types of commands for remote control of the Tivo.
- IRCODE
- KEYBOARD
- SETCH
- FORCECH
- TELEPORT

> I have noticed that recent releases of this protocol, have the SETCH and FORCECH
commands broken, so changes channels is done in this plugin using IRCODE NUM*.

### IRCODE
This is used to simulate the pressing of a key on a Tivo handheld remote.
For a list of known IRCODES, see [this table](./IRCODES.md).
### KEYBOARD
This is used to simulate the pressing on a keyboard (for the remotes that
folded out to a keyboard).
For a list of known KEYBOARD codes, see Appendix A of the
[PDF file](./TiVo_TCP_Network_Remote_Control_Protocol.pdf).
### SETCH
This is used to set the channel, when in LIVETV mode
### FORCECH
This is used to force changing of a channel.
### TELEPORT
This is used to teleport you to one of a couple of pre-defined Tivo screens.
- TIVO
- LIVETV
- GUIDE
- NOWPLAYING
### BACKGROUND
- For a discussion thread on how this was initially discovered, see 
[this web page](https://www.tivocommunity.com/threads/tivo-ui-control-via-telnet-no-hacking-required.392385/).
There are other threads in that forum (as well).
- For those interested in the entire protocol document (published by Tivo), see the 
PDF file in this directory.

