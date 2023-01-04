package org.infpls.royale.server.game.dao.lobby;

import java.io.IOException;
import java.util.*;

import org.infpls.royale.server.util.Oak;

public class LobbyDao {
  private final List<GameLobby> lobbies;
  private GameLobby jail;
  
  public LobbyDao() {
    lobbies = new ArrayList();
    try { jail = new JailLobby(); jail.start(); }
    catch(IOException ioex) {
      Oak.log(Oak.Level.CRIT, "Failed to start jail lobby!");
    }
  }
  
  public GameLobby createLobby(boolean priv, String code) throws IOException {
    GameLobby lobby = new OfficialLobby(priv, code);
    lobbies.add(lobby);
    lobby.start();
    return lobby;
  }

  /* Returns a lobby with open space for a player to join. */
  public GameLobby findLobby(boolean priv, int mode) throws IOException {
    cleanUp();
    String[] GAMEMODES = { "vanilla", "pvp" };
    //if(mode < 0 || mode >= GAMEMODES.length) { mode = 0; }
    String gameMode = GAMEMODES[mode];

    if (priv) { return createLobby(true, gameMode); }

    for(int i=0;i<lobbies.size();i++) {
      final GameLobby lobby = lobbies.get(i);

      if(!lobby.isFull() && !lobby.isLocked() && lobby.getMode() == gameMode) {
        return lobby;
      }
    }
    final GameLobby lobby = createLobby(priv, gameMode);
    return lobby;
  }
  
  public GameLobby getJail() {
    return jail;
  }
 
  /* This method deletes any user created lobbies that are flagged as closed. */
  public void cleanUp() {
    for(int i=0;i<lobbies.size();i++) {
      if(lobbies.get(i).isClosed()) {
        lobbies.remove(i--);
      }
    }
  }

  public void destroy() {
    try {
      for(int i=0;i<lobbies.size();i++) {
        lobbies.get(i).close("Game server is shutting down...");
      }
    }
    catch(IOException ex) {
      Oak.log(Oak.Level.ERR, "Error during server shutdown.", ex);
    }
  }
}
